import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Share2, 
  Ticket,
  Minus,
  Plus,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/Logo";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, isValid } from "date-fns";

/* =========================
   TYPES
========================= */
interface TicketTier {
  name: string;
  price: number;
  capacity: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  cover_image: string;
  event_date: string;
  start_time: string;
  end_time: string;
  city: string;
  venue_name: string;
  is_paid: boolean;
  ticket_price: number;
  remaining_seats: number;
  total_seats: number;
  booking_deadline: string;
  status: string;
  ticket_tiers: TicketTier[]; 
}

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState(1);
  const [booking, setBooking] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);

  useEffect(() => {
    if (id) fetchEvent();
    
    return () => {
      const rzpContainer = document.getElementsByClassName('razorpay-container')[0];
      if (rzpContainer) {
        (rzpContainer as HTMLElement).style.display = 'none';
      }
    };
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (error || !data) {
        toast({ title: "Event not found", variant: "destructive" });
        navigate('/explore');
        return;
      }

      const rawData = data as any;
      
      let tiers: TicketTier[] = [];
      if (Array.isArray(rawData.ticket_tiers)) {
        tiers = rawData.ticket_tiers;
      } else if (typeof rawData.ticket_tiers === 'string') {
        try {
          tiers = JSON.parse(rawData.ticket_tiers);
        } catch {
          tiers = [];
        }
      }

      const formattedData: Event = {
        ...rawData,
        ticket_tiers: tiers
      };

      setEvent(formattedData);

      if (formattedData.ticket_tiers.length > 0) {
        setSelectedTier(formattedData.ticket_tiers[0]);
      } else {
        setSelectedTier({
          name: "General Admission",
          price: Number(formattedData.ticket_price) || 0,
          capacity: formattedData.total_seats
        });
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      toast({ title: "Connection error", description: "Failed to load event details.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: event?.title || 'Check out this event!',
          text: event?.description?.substring(0, 100),
          url: window.location.href,
        });
      } else {
        throw new Error();
      }
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard" });
    }
  };

  const generateQRHash = () => `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  const handleBooking = async () => {
    if (!user) { 
      toast({ title: "Login Required", description: "Please sign in to book tickets." });
      navigate('/auth'); 
      return; 
    }
    
    if (!event || !selectedTier || booking) return;

    if (seats > event.remaining_seats) {
      toast({ title: "Limited Availability", description: "The requested number of seats is no longer available.", variant: "destructive" });
      return;
    }

    setBooking(true);

    try {
      const isPaidFlow = event.is_paid && selectedTier.price > 0;
      const totalAmount = isPaidFlow ? selectedTier.price * seats : 0;
      const qrHash = generateQRHash();

      const finalize = async () => {
        // Step 1: Insert Booking
        const { error: bookingError } = await supabase.from('event_bookings').insert([{
          event_id: event.id,
          user_id: user.id,
          seats_booked: seats,
          amount_paid: totalAmount,
          qr_code_hash: qrHash,
          booking_status: 'confirmed',
          ticket_tier_name: selectedTier.name
        }]);

        if (bookingError) throw bookingError;
        
        // Step 2: Atomic Update via RPC (Patched Logic)
        const { error: updateError } = await supabase.rpc('book_event_tickets', {
          p_event_id: event.id,
          p_seats_to_book: seats,
          p_tier_name: selectedTier.name
        });

        if (updateError) throw new Error("Failed to update seat availability.");

        toast({ title: "Tickets Confirmed!", description: `Successfully booked ${seats} ${selectedTier.name} pass(es).` });
        navigate('/reservations');
      };

      if (isPaidFlow) {
        const res = await fetch("https://dinedeal-backend-076n.onrender.com/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            amount: totalAmount, 
            type: "event", 
            eventId: event.id, 
            userId: user.id, 
            tierName: selectedTier.name 
          }),
        });

        if (!res.ok) throw new Error("Could not initialize payment gateway.");
        
        const orderData = await res.json();
        
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: orderData.order.amount,
          currency: "INR",
          name: "DineDeal Events",
          description: event.title,
          order_id: orderData.order.id,
          handler: async (response: any) => {
            const v = await fetch("https://dinedeal-backend-076n.onrender.com/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const vData = await v.json();
            if (vData.success) {
              await finalize();
            } else {
              toast({ title: "Payment Verification Failed", variant: "destructive" });
              setBooking(false);
            }
          },
          modal: { ondismiss: () => setBooking(false) },
          prefill: { email: user.email || "", contact: "" },
          theme: { color: "#7C3AED" }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        await finalize();
      }
    } catch (e: any) {
      console.error("Booking Logic Error:", e);
      toast({ title: "Booking Failed", description: e.message || "An unexpected error occurred.", variant: "destructive" });
      setBooking(false);
    }
  };

  if (loading || !event) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground animate-pulse">Fetching event details...</p>
      </div>
    );
  }

  const isSoldOut = event.remaining_seats <= 0;
  const eventDateObj = new Date(event.event_date);
  const displayDate = isValid(eventDateObj) ? format(eventDateObj, "PPP") : "Date TBA";

  return (
    <div className="min-h-screen bg-background pb-44">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b bg-background/95 p-4 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-accent">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <Logo />
        <button onClick={handleShare} className="rounded-full p-2 hover:bg-accent">
          <Share2 className="h-5 w-5" />
        </button>
      </header>

      <div className="relative aspect-video w-full overflow-hidden md:aspect-[21/9]">
        <img 
          src={event.cover_image || "/placeholder.svg"} 
          className="h-full w-full object-cover transition-transform hover:scale-105 duration-700" 
          alt={event.title} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Badge className="absolute bottom-4 left-4 text-lg font-bold bg-primary border-none px-4 py-1.5 shadow-xl">
          {selectedTier?.price === 0 ? "FREE" : `₹${selectedTier?.price ?? event.ticket_price}`}
        </Badge>
      </div>

      <main className="container max-w-3xl space-y-8 py-8 px-4">
        <section className="space-y-4">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{event.title}</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 bg-accent/40 p-3 rounded-xl">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-semibold">When</p>
                <p className="text-sm text-muted-foreground">{displayDate}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-accent/40 p-3 rounded-xl">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Where</p>
                <p className="text-sm text-muted-foreground truncate">{event.venue_name}, {event.city}</p>
              </div>
            </div>
          </div>
        </section>

        {event.ticket_tiers && event.ticket_tiers.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2"><Ticket className="h-5 w-5 text-primary" /> Tickets</h2>
              <span className="text-xs text-muted-foreground bg-accent px-2 py-1 rounded-full">{event.remaining_seats} available</span>
            </div>
            <div className="grid gap-3">
              {event.ticket_tiers.map((tier) => (
                <button 
                  key={tier.name}
                  disabled={booking}
                  onClick={() => setSelectedTier(tier)}
                  className={`flex items-center justify-between rounded-2xl border-2 p-5 transition-all active:scale-[0.98] ${
                    selectedTier?.name === tier.name 
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-md" 
                    : "border-border hover:border-primary/40 bg-card"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold text-lg">{tier.name}</p>
                    <p className="text-sm font-medium text-primary">
                      {tier.price === 0 ? "Complimentary" : `₹${tier.price}`}
                    </p>
                  </div>
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedTier?.name === tier.name ? "bg-primary border-primary" : "border-muted"
                  }`}>
                    {selectedTier?.name === tier.name && <Check className="h-4 w-4 text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {event.description && (
          <section className="space-y-3">
            <h2 className="text-xl font-bold">About this event</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
              <p className="whitespace-pre-wrap">{event.description}</p>
            </div>
          </section>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 p-4 pb-10 backdrop-blur-lg shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
        <div className="container max-w-lg mx-auto flex flex-col gap-5">
          {!isSoldOut && (
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-sm font-bold">Select Quantity</p>
                <p className="text-xs text-muted-foreground">Max {Math.min(10, event.remaining_seats)} per booking</p>
              </div>
              <div className="flex items-center gap-4 bg-secondary p-1 rounded-xl">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-lg"
                  onClick={() => setSeats(s => Math.max(1, s - 1))}
                  disabled={booking || seats <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-extrabold text-xl w-6 text-center">{seats}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-lg"
                  onClick={() => setSeats(s => Math.min(event.remaining_seats, s + 1))}
                  disabled={booking || seats >= event.remaining_seats || seats >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          <Button 
            className="w-full h-14 text-lg font-bold rounded-2xl transition-all shadow-purple-500/20 shadow-lg" 
            onClick={handleBooking} 
            disabled={booking || isSoldOut || !selectedTier}
          >
            {isSoldOut ? (
              "Event Sold Out"
            ) : booking ? (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Verifying...
              </div>
            ) : (
              `Reserve Seats • ${selectedTier?.price === 0 ? "FREE" : `₹${(selectedTier?.price || 0) * seats}`}`
            )}
          </Button>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}

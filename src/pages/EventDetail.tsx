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
import { format } from "date-fns";

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
  ticket_tiers: TicketTier[] | null; 
}

/* =========================
   COMPONENT
========================= */

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

      const eventData = data as Event;
      setEvent(eventData);

      // Auto-select the first tier if available
      if (eventData.ticket_tiers && eventData.ticket_tiers.length > 0) {
        setSelectedTier(eventData.ticket_tiers[0]);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      toast({ title: "Error loading event", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: event?.title,
        text: event?.description,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard" });
    }
  };

  const generateQRHash = () => {
    return `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  };

  const handleBooking = async () => {
    if (!user) {
      toast({ title: "Please sign in to book" });
      navigate('/auth');
      return;
    }

    if (!event || !selectedTier || booking) return;

    // Safety check for seats
    if (seats > event.remaining_seats) {
      toast({ title: "Not enough seats available", variant: "destructive" });
      return;
    }

    setBooking(true);

    try {
      const isActuallyPaid = event.is_paid && selectedTier.price > 0;
      const totalAmount = isActuallyPaid ? selectedTier.price * seats : 0;
      const qrHash = generateQRHash();

      // Step to save to Database (Common for Free & Paid)
      const finalizeBooking = async () => {
        const { error: bookingError } = await supabase
          .from('event_bookings')
          .insert([{
            event_id: event.id,
            user_id: user.id,
            seats_booked: seats,
            amount_paid: totalAmount,
            qr_code_hash: qrHash,
            booking_status: 'confirmed',
            ticket_tier_name: selectedTier.name
          }]);

        if (bookingError) throw bookingError;

        // Atomic update of remaining seats
        const { error: updateError } = await supabase
          .from('events')
          .update({ remaining_seats: event.remaining_seats - seats })
          .eq('id', event.id);

        if (updateError) throw updateError;

        toast({ 
          title: "Success!", 
          description: isActuallyPaid ? "Payment successful. Tickets booked." : "Free tickets reserved!" 
        });
        navigate('/reservations');
      };

      if (isActuallyPaid) {
        // --- RAZORPAY FLOW ---
        const res = await fetch("https://dinedeal-backend-076n.onrender.com/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: totalAmount,
            type: "event",
            eventId: event.id,
            seats,
            userId: user.id,
            qrHash,
            tierName: selectedTier.name
          }),
        });

        const data = await res.json();
        if (!data?.order?.id) throw new Error("Order creation failed");

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: data.order.amount,
          currency: "INR",
          name: event.title,
          description: `${selectedTier.name} Booking`,
          order_id: data.order.id,
          handler: async (response: any) => {
            const verifyRes = await fetch("https://dinedeal-backend-076n.onrender.com/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              await finalizeBooking();
            } else {
              toast({ title: "Payment failed", variant: "destructive" });
              setBooking(false);
            }
          },
          modal: { ondismiss: () => setBooking(false) },
          prefill: { email: user.email ?? "" },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // --- FREE FLOW ---
        await finalizeBooking();
      }
    } catch (error: any) {
      console.error("Booking Error:", error);
      toast({ title: "Booking failed", description: error.message, variant: "destructive" });
      setBooking(false);
    }
  };

  if (loading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isSoldOut = event.remaining_seats <= 0;
  const currentPrice = selectedTier ? selectedTier.price * seats : 0;

  return (
    <div className="min-h-screen bg-background pb-40">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="hover:bg-accent p-2 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Logo />
        <button onClick={handleShare} className="hover:bg-accent p-2 rounded-full transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      <div className="relative aspect-video w-full max-w-4xl mx-auto overflow-hidden">
        <img src={event.cover_image || "/placeholder.svg"} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute bottom-4 left-4">
          <Badge className="text-lg px-4 py-2 bg-primary shadow-lg border-none">
            {selectedTier?.price === 0 ? "FREE" : `₹${selectedTier?.price ?? event.ticket_price}`}
          </Badge>
        </div>
      </div>

      <main className="container max-w-2xl py-6 space-y-8">
        <section>
          <h1 className="text-2xl font-bold mb-4 leading-tight">{event.title}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground bg-accent/30 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-primary" /> 
              {format(new Date(event.event_date), "PPP")}
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-primary" /> 
              {event.venue_name}, {event.city}
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-primary" /> 
              {event.remaining_seats > 0 ? `${event.remaining_seats} seats left` : "Waitlist Full"}
            </div>
          </div>
        </section>

        {event.ticket_tiers && event.ticket_tiers.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Ticket className="w-5 h-5" /> Select Ticket Type
            </h2>
            <div className="grid gap-3">
              {event.ticket_tiers.map((tier) => (
                <button 
                  key={tier.name}
                  disabled={booking}
                  onClick={() => setSelectedTier(tier)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${
                    selectedTier?.name === tier.name ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50"
                  } ${booking ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div>
                    <p className="font-bold">{tier.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {tier.price === 0 ? "Complimentary" : `₹${tier.price}`}
                    </p>
                  </div>
                  {selectedTier?.name === tier.name && (
                    <div className="bg-primary rounded-full p-1 shadow-md">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {event.description && (
          <section className="space-y-3">
            <h2 className="font-bold text-lg">About this event</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </section>
        )}
      </main>

      {/* FOOTER ACTION BAR */}
      <div className="fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur-md border-t p-4 z-50">
        <div className="container max-w-md mx-auto space-y-4">
          {!isSoldOut && (
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-semibold">Quantity</span>
              <div className="flex items-center gap-4 bg-accent/50 rounded-lg p-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setSeats(s => Math.max(1, s - 1))} 
                  disabled={booking || seats <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="font-bold text-lg min-w-[20px] text-center">{seats}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setSeats(s => Math.min(event.remaining_seats, s + 1))} 
                  disabled={booking || seats >= event.remaining_seats}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          <Button 
            className="w-full py-7 text-lg font-bold shadow-xl" 
            onClick={handleBooking} 
            disabled={booking || isSoldOut || !selectedTier}
          >
            {isSoldOut ? (
              "Sold Out"
            ) : booking ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              `Book Now • ${currentPrice === 0 ? "FREE" : `₹${currentPrice}`}`
            )}
          </Button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

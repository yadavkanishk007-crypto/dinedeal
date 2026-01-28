import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
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
  ticket_tiers: TicketTier[] | null; // Added Tier support
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
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (error || !data) {
      toast({ title: "Event not found", variant: "destructive" });
      navigate('/explore');
    } else {
      setEvent(data);
      // Auto-select the first tier (usually General) by default
      if (data.ticket_tiers && data.ticket_tiers.length > 0) {
        setSelectedTier(data.ticket_tiers[0]);
      }
    }
    setLoading(false);
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
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

    if (seats > event.remaining_seats) {
      toast({ title: "Not enough seats available", variant: "destructive" });
      return;
    }

    setBooking(true);

    try {
      const unitPrice = event.is_paid ? selectedTier.price : 0;
      const totalAmount = unitPrice * seats;
      const qrHash = generateQRHash();

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
            ticket_tier_name: selectedTier.name // Added to capture tier
          }]);

        if (bookingError) throw bookingError;

        const { error: updateError } = await supabase
          .from('events')
          .update({ remaining_seats: event.remaining_seats - seats })
          .eq('id', event.id);

        if (updateError) throw updateError;

        toast({ title: "Booking confirmed!", description: `${seats} ${selectedTier.name} pass(es) booked.` });
        navigate('/reservations');
      };

      if (event.is_paid && totalAmount > 0) {
        // --- PAID FLOW (Razorpay) ---
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
            if (verifyData.success) await finalizeBooking();
          },
          modal: { ondismiss: () => setBooking(false) },
          prefill: { email: user.email ?? "" },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        await finalizeBooking();
        setBooking(false);
      }
    } catch (error: any) {
      toast({ title: "Booking failed", description: error.message, variant: "destructive" });
      setBooking(false);
    }
  };

  if (loading || !event) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const isSoldOut = event.remaining_seats === 0;
  const currentPrice = selectedTier ? selectedTier.price * seats : 0;

  return (
    <div className="min-h-screen bg-background pb-40">
      <header className="sticky top-0 z-40 glass border-b p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
        <Logo size="sm" />
        <button onClick={handleShare}><Share2 className="w-5 h-5" /></button>
      </header>

      <div className="relative aspect-video">
        <img src={event.cover_image || "/placeholder.svg"} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute bottom-4 left-4">
          <Badge className="text-lg px-4 py-2 bg-primary">₹{selectedTier?.price || event.ticket_price}</Badge>
        </div>
      </div>

      <main className="container py-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-4">{event.title}</h1>
          <div className="space-y-3 text-muted-foreground">
            <div className="flex items-center gap-3"><Calendar className="w-4 h-4" /> {format(new Date(event.event_date), "PPP")}</div>
            <div className="flex items-center gap-3"><MapPin className="w-4 h-4" /> {event.venue_name}, {event.city}</div>
            <div className="flex items-center gap-3"><Users className="w-4 h-4" /> {event.remaining_seats} seats left</div>
          </div>
        </div>

        {/* TICKET SELECTION */}
        {event.ticket_tiers && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Ticket className="w-5 h-5" /> Select Pass Type</h2>
            <div className="grid gap-3">
              {event.ticket_tiers.map((tier) => (
                <div 
                  key={tier.name}
                  onClick={() => setSelectedTier(tier)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                    selectedTier?.name === tier.name ? "border-primary bg-primary/5 shadow-sm" : "border-border"
                  }`}
                >
                  <div>
                    <p className="font-bold">{tier.name}</p>
                    <p className="text-sm text-muted-foreground">₹{tier.price}</p>
                  </div>
                  {selectedTier?.name === tier.name && <div className="bg-primary rounded-full p-1"><Check className="w-3 h-3 text-white" /></div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {event.description && (
          <div className="space-y-2">
            <h2 className="font-bold text-lg">About</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-16 left-0 right-0 glass border-t p-4 z-50">
        <div className="container max-w-lg mx-auto space-y-4">
          {!isSoldOut && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tickets for {selectedTier?.name}</span>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => setSeats(s => Math.max(1, s - 1))} disabled={booking}><Minus className="w-4 h-4" /></Button>
                <span className="font-bold">{seats}</span>
                <Button variant="outline" size="icon" onClick={() => setSeats(s => Math.min(event.remaining_seats, s + 1))} disabled={booking}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
          <Button className="w-full py-6 text-lg" onClick={handleBooking} disabled={booking || isSoldOut || !selectedTier}>
            {isSoldOut ? "Sold Out" : booking ? "Booking..." : `Book Now • ₹${currentPrice}`}
          </Button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

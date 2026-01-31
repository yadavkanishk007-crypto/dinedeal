import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
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
  booking_deadline: string;
  status: string;
  ticket_tiers: TicketTier[];
  available_seats: number;
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
  }, [id]);

  const fetchEvent = async () => {
    try {
      /* 1️⃣ Availability */
      const { data: availability, error } = await supabase
        .from("event_availability")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !availability) throw error;

      /* 2️⃣ Event details */
      const { data: base, error: baseError } = await supabase
        .from("events")
        .select(`
          title,
          description,
          cover_image,
          event_date,
          start_time,
          end_time,
          city,
          venue_name,
          is_paid,
          ticket_price,
          booking_deadline,
          status,
          ticket_tiers
        `)
        .eq("id", id)
        .single();

      if (baseError || !base) throw baseError;

      /* 3️⃣ Parse tiers */
      let tiers: TicketTier[] = [];
      if (Array.isArray(base.ticket_tiers)) {
        tiers = base.ticket_tiers;
      } else if (typeof base.ticket_tiers === "string") {
        try {
          tiers = JSON.parse(base.ticket_tiers);
        } catch {
          tiers = [];
        }
      }

      const formatted: Event = {
        ...(base as any),
        id: availability.id,
        available_seats: availability.available_seats,
        ticket_tiers: tiers
      };

      setEvent(formatted);
      setSelectedTier(tiers[0] ?? { name: "General Admission", price: base.ticket_price || 0 });
    } catch (err) {
      console.error(err);
      toast({ title: "Event not found", variant: "destructive" });
      navigate("/explore");
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user || !event || !selectedTier || booking) return;

    if (seats > event.available_seats) {
      toast({
        title: "Limited availability",
        description: "Seats just sold out.",
        variant: "destructive"
      });
      return;
    }

    setBooking(true);

    try {
      const totalAmount = event.is_paid ? selectedTier.price * seats : 0;

      const finalize = async () => {
        const { error } = (supabase as any).rpc("book_event_seats", {
          p_event_id: event.id,
          p_user_id: user.id,
          p_seats: seats,
          p_tier_name: selectedTier.name,
          p_amount: totalAmount
        });

        if (error) throw error;

        toast({
          title: "Tickets Confirmed",
          description: `Booked ${seats} seat(s)`
        });
        navigate("/reservations");
      };

      if (totalAmount > 0) {
        const res = await fetch(
          "https://dinedeal-backend-076n.onrender.com/api/payments/create-order",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: totalAmount,
              type: "event",
              eventId: event.id,
              userId: user.id,
              tierName: selectedTier.name
            })
          }
        );

        const { order } = await res.json();
        new (window as any).Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: "INR",
          order_id: order.id,
          handler: finalize
        }).open();
      } else {
        await finalize();
      }
    } catch (e: any) {
      toast({ title: "Booking failed", description: e.message, variant: "destructive" });
      setBooking(false);
    }
  };

  if (loading || !event) {
    return <div className="h-screen flex items-center justify-center">Loading…</div>;
  }

  const isSoldOut = event.available_seats <= 0;
  const date = isValid(new Date(event.event_date))
    ? format(new Date(event.event_date), "PPP")
    : "TBA";

  return (
    <div className="min-h-screen bg-background pb-36">
      <header className="sticky top-0 z-50 flex justify-between p-4 border-b">
        <button onClick={() => navigate(-1)}><ArrowLeft /></button>
        <Logo />
        <button><Share2 /></button>
      </header>

      <main className="container max-w-3xl py-6 space-y-6">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <p>{date} • {event.city}</p>

        <div className="flex justify-between text-sm">
          <span>{event.available_seats} seats available</span>
        </div>
      </main>

      {/* 🔥 SMALLER, ALWAYS VISIBLE CTA */}
      <div className="fixed bottom-14 left-0 right-0 bg-background border-t p-3 z-50">
        <Button
          className="w-full h-11 text-sm font-semibold"
          disabled={booking || isSoldOut}
          onClick={handleBooking}
        >
          {isSoldOut ? "Sold Out" : "Book Tickets"}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}

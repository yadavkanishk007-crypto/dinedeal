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
  Plus 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/Logo";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
      toast({ title: "Please sign in to book", description: "Redirecting to login..." });
      navigate('/auth');
      return;
    }

    if (!event) return;

    if (seats > event.remaining_seats) {
      toast({ title: "Not enough seats available", variant: "destructive" });
      return;
    }

    setBooking(true);

    try {
      const totalAmount = event.is_paid ? event.ticket_price * seats : 0;
      const qrHash = generateQRHash();

      // Create booking
      const { error: bookingError } = await supabase
        .from('event_bookings')
        .insert([{
          event_id: event.id,
          user_id: user.id,
          seats_booked: seats,
          amount_paid: totalAmount,
          qr_code_hash: qrHash,
          booking_status: 'confirmed',
        }]);

      if (bookingError) throw bookingError;

      // Decrement remaining seats
      const { error: updateError } = await supabase
        .from('events')
        .update({ remaining_seats: event.remaining_seats - seats })
        .eq('id', event.id)
        .gte('remaining_seats', seats);

      if (updateError) { 
        throw new Error("Seats No Longer Available");
      }

      toast({
        title: "Booking confirmed!",
        description: `${seats} ticket(s) booked for ${event.title}`,
      });

      navigate('/reservations');
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) return null;

  const isSoldOut = event.remaining_seats === 0;
  const totalPrice = event.is_paid ? event.ticket_price * seats : 0;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="container py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Logo size="sm" />
          <button onClick={handleShare} className="p-2 -mr-2">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative aspect-video bg-muted">
        {event.cover_image ? (
          <img
            src={event.cover_image}
            alt={event.title}
            className="w-full h-full object-cover"
          /> ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-16 h-16 text-muted-foreground/50" />
          </div>
        )}
        {/* Price Badge */}
        <div className="absolute bottom-4 left-4">
          {event.is_paid ? (
            <Badge className="text-lg px-4 py-2 bg-primary text-primary-foreground">
              ₹{event.ticket_price}
            </Badge>
          ) : (
            <Badge className="text-lg px-4 py-2 bg-green-500 text-white">
              Free
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="container py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-display font-bold mb-2">{event.title}</h1>
          
          <div className="space-y-3 text-muted-foreground">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <span>{format(new Date(event.event_date), "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <span>
                {formatTime(event.start_time)}
                {event.end_time && ` - ${formatTime(event.end_time)}`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <span>{event.venue_name}, {event.city}</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <span>{event.remaining_seats} of {event.total_seats} seats available</span>
            </div>
          </div>
        </motion.div>

        {event.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <h2 className="font-bold text-lg">About This Event</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {event.description}
            </p>
          </motion.div>
        )}
      </main>

      {/* Fixed Bottom Booking Bar */}
      <div className="fixed bottom-16 left-0 right-0 glass border-t p-4">
        <div className="container max-w-lg mx-auto">
          {isSoldOut ? (
            <Button disabled className="w-full">
              Sold Out
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Seat Selector */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Number of tickets</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSeats(Math.max(1, seats - 1))}
                    disabled={seats <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-bold">{seats}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSeats(Math.min(event.remaining_seats, seats + 1))}
                    disabled={seats >= event.remaining_seats}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Book Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleBooking}
                disabled={booking}
              >
                <Ticket className="w-4 h-4 mr-2" />
                {booking ? "Booking..." : event.is_paid 
                  ? `Book Now • ₹${totalPrice}` 
                  : "Book Free Tickets"
                }
              </Button>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

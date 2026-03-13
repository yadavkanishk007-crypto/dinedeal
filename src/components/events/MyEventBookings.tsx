import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Ticket, 
  Users, 
  QrCode, 
  X,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";

interface EventBooking {
  id: string;
  event_id: string;
  seats_booked: number;
  amount_paid: number;
  booking_status: string;
  qr_code_hash: string;
  checked_in_at: string | null;
  created_at: string;
  events?: {
    title: string;
    event_date: string;
    start_time: string;
    end_time: string | null;
    city: string;
    venue_name: string;
    cover_image: string | null;
    status: string;
  };
}

interface MyEventBookingsProps {
  filter: "upcoming" | "past" | "cancelled";
}

export default function MyEventBookings({ filter }: MyEventBookingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<EventBooking | null>(null);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("event_bookings")
        .select(`
          *,
          events:event_id (
            title,
            event_date,
            start_time,
            end_time,
            city,
            venue_name,
            cover_image,
            status
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching event bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const filteredBookings = bookings.filter((b) => {
    if (!b.events) return false;
    if (filter === "cancelled") return b.booking_status === "cancelled";
    if (filter === "upcoming") {
      return b.events.event_date >= today && b.booking_status !== "cancelled";
    }
    return b.events.event_date < today && b.booking_status !== "cancelled";
  });

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, "h:mm a");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-500";
      case "attended":
        return "bg-blue-500/10 text-blue-500";
      case "cancelled":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (filteredBookings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No {filter} event bookings</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {filter === "upcoming"
                ? "Discover and book tickets for upcoming events"
                : filter === "past"
                ? "Your past event tickets will appear here"
                : "No cancelled tickets"}
            </p>
            {filter === "upcoming" && (
              <Button variant="gradient" onClick={() => navigate("/explore")}>
                Explore Events
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {filteredBookings.map((booking, index) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={`border-border/50 overflow-hidden ${
                booking.booking_status === "cancelled" ? "opacity-60" : ""
              }`}
            >
              <CardContent className="p-0">
                <div className="flex">
                  {/* Event Image */}
                  {booking.events?.cover_image && (
                    <div className="w-24 sm:w-32 shrink-0">
                      <img
                        src={booking.events.cover_image}
                        alt={booking.events.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {booking.events?.title || "Event"}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {booking.events?.venue_name}, {booking.events?.city}
                        </p>
                      </div>
                      <Badge className={getStatusColor(booking.booking_status)}>
                        {booking.booking_status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-primary" />
                        {booking.events?.event_date &&
                          format(
                            new Date(booking.events.event_date),
                            "EEE, MMM d"
                          )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-primary" />
                        {booking.events?.start_time &&
                          formatTime(booking.events.start_time)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-primary" />
                        {booking.seats_booked} {booking.seats_booked === 1 ? "seat" : "seats"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {booking.booking_status !== "cancelled" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          View Ticket
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/event/${booking.event_id}`)}
                      >
                        View Event
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* QR Code Modal */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Your Ticket</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="font-bold text-lg">{selectedBooking.events?.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {selectedBooking.events?.venue_name}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-xl">
                  <QRCodeSVG
                    value={selectedBooking.qr_code_hash}
                    size={200}
                    level="H"
                  />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {selectedBooking.events?.event_date &&
                      format(
                        new Date(selectedBooking.events.event_date),
                        "EEE, MMM d, yyyy"
                      )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">
                    {selectedBooking.events?.start_time &&
                      formatTime(selectedBooking.events.start_time)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seats</span>
                  <span className="font-medium">{selectedBooking.seats_booked}</span>
                </div>
                {selectedBooking.amount_paid > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="font-medium">₹{selectedBooking.amount_paid}</span>
                  </div>
                )}
              </div>

              {selectedBooking.checked_in_at && (
                <div className="p-3 rounded-xl bg-success/10 text-success text-center text-sm">
                  ✓ Checked in at{" "}
                  {format(new Date(selectedBooking.checked_in_at), "h:mm a")}
                </div>
              )}

              <p className="text-xs text-center text-muted-foreground">
                Show this QR code at the venue entrance
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, MapPin, Ticket, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Event {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  event_date: string;
  start_time: string;
  end_time: string | null;
  city: string;
  venue_name: string;
  is_paid: boolean;
  ticket_price: number;
  total_seats: number;
  remaining_seats: number;
}

interface ExploreEventsProps {
  searchQuery: string;
  location: string;
}

export default function ExploreEvents({ searchQuery, location }: ExploreEventsProps) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("status", "published")
        .gte("event_date", new Date().toISOString().split("T")[0])
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, "h:mm a");
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.city.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (filteredEvents.length === 0) {
    return (
      <motion.div
        className="text-center py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-2">
          No events found
        </h3>
        <p className="text-muted-foreground text-sm">
          Check back later for upcoming events
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div className="grid gap-4" layout>
      <AnimatePresence mode="popLayout">
        {filteredEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            layout
          >
            <Card
              className="overflow-hidden border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/event/${event.id}`)}
            >
              <CardContent className="p-0">
                <div className="flex">
                  {/* Event Image */}
                  <div className="w-28 sm:w-36 shrink-0 relative">
                    {event.cover_image ? (
                      <img
                        src={event.cover_image}
                        alt={event.title}
                        className="w-full h-full object-cover aspect-square"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center aspect-square">
                        <Calendar className="w-8 h-8 text-primary/40" />
                      </div>
                    )}
                    
                    {/* Date Badge */}
                    <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1 text-center">
                      <p className="text-xs font-bold text-primary">
                        {format(new Date(event.event_date), "MMM")}
                      </p>
                      <p className="text-lg font-bold text-foreground leading-none">
                        {format(new Date(event.event_date), "d")}
                      </p>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground line-clamp-2">
                        {event.title}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={
                          event.is_paid
                            ? "bg-primary/10 text-primary shrink-0"
                            : "bg-green-500/10 text-green-500 shrink-0"
                        }
                      >
                        {event.is_paid ? `₹${event.ticket_price}` : "Free"}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span className="truncate">
                          {event.venue_name}, {event.city}
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {format(new Date(event.event_date), "EEE, MMM d")} •{" "}
                        {formatTime(event.start_time)}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5 text-primary" />
                        {event.remaining_seats} seats left
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

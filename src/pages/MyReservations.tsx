import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Check, 
  X, 
  Loader2,
  CalendarDays,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Reservation {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  special_requests: string | null;
  status: string;
  created_at: string;
  restaurant_id: string;
  restaurants?: {
    name: string;
    address: string;
    city: string;
    image_url: string | null;
  };
}

const MyReservations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "past" | "cancelled">("upcoming");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchReservations();
  }, [user]);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          restaurants:restaurant_id (
            name,
            address,
            city,
            image_url
          )
        `)
        .eq("user_id", user?.id)
        .order("reservation_date", { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;
      
      setReservations(reservations.map(r => 
        r.id === id ? { ...r, status: "cancelled" } : r
      ));
      
      toast({ title: "Reservation cancelled" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const today = new Date().toISOString().split("T")[0];
  
  const filteredReservations = reservations.filter(r => {
    if (filter === "cancelled") return r.status === "cancelled";
    if (filter === "upcoming") {
      return r.reservation_date >= today && r.status !== "cancelled";
    }
    return r.reservation_date < today && r.status !== "cancelled";
  });

  const upcomingCount = reservations.filter(r => 
    r.reservation_date >= today && r.status !== "cancelled"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container py-4 flex items-center justify-between">
          <motion.button
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <Logo />
          <div className="w-10" />
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">My Reservations</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {upcomingCount} upcoming {upcomingCount === 1 ? "booking" : "bookings"}
              </p>
            </div>
            <CalendarDays className="w-10 h-10 text-primary" />
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(["upcoming", "past", "cancelled"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "secondary"}
              size="sm"
              onClick={() => setFilter(f)}
              className="shrink-0"
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {/* Reservations List */}
        {filteredReservations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No {filter} reservations</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  {filter === "upcoming" 
                    ? "Book a table at your favorite restaurant"
                    : filter === "past"
                    ? "Your past bookings will appear here"
                    : "No cancelled reservations"
                  }
                </p>
                {filter === "upcoming" && (
                  <Button variant="gradient" onClick={() => navigate("/explore")}>
                    Explore Restaurants
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredReservations.map((reservation, index) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`border-border/50 overflow-hidden ${
                  reservation.status === "cancelled" ? "opacity-60" : ""
                }`}>
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Restaurant Image */}
                      {reservation.restaurants?.image_url && (
                        <div className="w-24 sm:w-32 shrink-0">
                          <img
                            src={reservation.restaurants.image_url}
                            alt={reservation.restaurants.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {reservation.restaurants?.name || "Restaurant"}
                            </h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {reservation.restaurants?.city}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                            reservation.status === "pending" ? "bg-amber-500/10 text-amber-500" :
                            reservation.status === "confirmed" ? "bg-green-500/10 text-green-500" :
                            reservation.status === "completed" ? "bg-blue-500/10 text-blue-500" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {reservation.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-primary" />
                            {new Date(reservation.reservation_date).toLocaleDateString("en-IN", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-primary" />
                            {reservation.reservation_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-primary" />
                            {reservation.party_size}
                          </span>
                        </div>

                        {/* Actions */}
                        {reservation.status === "pending" || reservation.status === "confirmed" ? (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => cancelReservation(reservation.id)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => navigate(`/restaurant/${reservation.restaurant_id}`)}
                            >
                              View Restaurant
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/restaurant/${reservation.restaurant_id}`)}
                          >
                            Book Again
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default MyReservations;

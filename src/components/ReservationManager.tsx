import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Users, Phone, Check, X, MessageSquare, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
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
}

interface ReservationManagerProps {
  restaurantId: string;
  restaurantName?: string;
  isActivityProvider?: boolean;
}

const ReservationManager = ({ restaurantId, restaurantName = "Restaurant", isActivityProvider = false }: ReservationManagerProps) => {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">("pending");

  useEffect(() => {
    fetchReservations();
  }, [restaurantId]);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("reservation_date", { ascending: true });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendStatusEmail = async (reservation: Reservation, newStatus: string) => {
    if (!reservation.email) return;
    
    try {
      await supabase.functions.invoke("send-reservation-email", {
        body: {
          to: reservation.email,
          type: "status_update",
          data: {
            customerName: reservation.name,
            restaurantName,
            reservationDate: reservation.reservation_date,
            reservationTime: reservation.reservation_time,
            partySize: reservation.party_size,
            status: newStatus,
            specialRequests: reservation.special_requests,
          },
        },
      });
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const reservation = reservations.find(r => r.id === id);
      
      const { error } = await supabase
        .from("reservations")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      
      setReservations(reservations.map((r) => (r.id === id ? { ...r, status } : r)));
      
      // Send email notification
      if (reservation) {
        sendStatusEmail(reservation, status);
      }
      
      toast({ 
        title: `Reservation ${status}`,
        description: reservation?.email ? "Email notification sent to customer" : undefined
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredReservations = reservations.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const today = new Date().toISOString().split("T")[0];
  const upcomingCount = reservations.filter(
    (r) => r.reservation_date >= today && r.status === "confirmed"
  ).length;
  const pendingCount = reservations.filter((r) => r.status === "pending").length;

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Reservations</h2>
        <div className="flex gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold">
            {pendingCount} pending
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">
            {upcomingCount} upcoming
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(["pending", "confirmed", "cancelled", "all"] as const).map((f) => (
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
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No {filter !== "all" ? filter : ""} {isActivityProvider ? "bookings" : "reservations"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReservations.map((reservation) => (
            <motion.div
              key={reservation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`border-border/50 ${
                reservation.status === "pending" ? "border-gold/30 bg-gold/5" :
                reservation.status === "cancelled" ? "opacity-60" : ""
              }`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{reservation.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          reservation.status === "pending" ? "bg-gold/10 text-gold" :
                          reservation.status === "confirmed" ? "bg-success/10 text-success" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {reservation.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(reservation.reservation_date).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {reservation.reservation_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {reservation.party_size} {isActivityProvider ? "players / guests" : "guests"}
                        </span>
                        {reservation.phone && (
                          <a href={`tel:${reservation.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                            <Phone className="w-4 h-4" />
                            {reservation.phone}
                          </a>
                        )}
                      </div>
                      {reservation.special_requests && (
                        <div className="flex items-start gap-2 text-sm bg-secondary/50 p-2 rounded-lg">
                          <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <span>{reservation.special_requests}</span>
                        </div>
                      )}
                    </div>
                    
                    {reservation.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="gradient"
                          size="sm"
                          onClick={() => updateStatus(reservation.id, "confirmed")}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(reservation.id, "cancelled")}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    )}

                    {reservation.status === "confirmed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(reservation.id, "completed")}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReservationManager;

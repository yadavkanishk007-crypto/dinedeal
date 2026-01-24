import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Users, MessageSquare, Phone, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TableBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
}

const TableBookingModal = ({ isOpen, onClose, restaurantId, restaurantName }: TableBookingModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    date: "",
    time: "",
    partySize: 2,
    specialRequests: "",
  });

  const timeSlots = [
    "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
    "2:00 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book a table",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch restaurant email for notification
      const { data: restaurantData } = await supabase
        .from("restaurants")
        .select("email")
        .eq("id", restaurantId)
        .single();

      const { error } = await supabase.from("reservations").insert({
        restaurant_id: restaurantId,
        user_id: user.id,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        reservation_date: formData.date,
        reservation_time: formData.time,
        party_size: formData.partySize,
        special_requests: formData.specialRequests,
        status: "pending",
      });

      if (error) throw error;

      // Send confirmation email to customer if email provided
      if (formData.email) {
        await supabase.functions.invoke("send-reservation-email", {
          body: {
            to: formData.email,
            type: "confirmation",
            data: {
              customerName: formData.name,
              restaurantName,
              reservationDate: formData.date,
              reservationTime: formData.time,
              partySize: formData.partySize,
              status: "pending",
              specialRequests: formData.specialRequests,
            },
          },
        });
      }

      // Send alert email to restaurant if restaurant has email
      if (restaurantData?.email) {
        await supabase.functions.invoke("send-reservation-email", {
          body: {
            to: restaurantData.email,
            type: "restaurant_alert",
            data: {
              customerName: formData.name,
              restaurantName,
              reservationDate: formData.date,
              reservationTime: formData.time,
              partySize: formData.partySize,
              status: "pending",
              specialRequests: formData.specialRequests,
              phone: formData.phone,
            },
          },
        });
      }

      toast({
        title: "Reservation Requested!",
        description: `Your table for ${formData.partySize} at ${restaurantName} on ${formData.date} is pending confirmation.`,
      });
      onClose();
      setFormData({
        name: "",
        phone: "",
        email: "",
        date: "",
        time: "",
        partySize: 2,
        specialRequests: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create reservation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md max-h-[90vh] overflow-y-auto"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg">Book a Table</CardTitle>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{restaurantName}</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Your Name *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Phone Number *"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email (optional)"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={formData.date}
                        min={today}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <select
                        value={formData.partySize}
                        onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) })}
                        className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background text-sm"
                        required
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((n) => (
                          <option key={n} value={n}>{n} {n === 1 ? "Guest" : "Guests"}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Select Time *
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot}
                          type="button"
                          variant={formData.time === slot ? "default" : "outline"}
                          size="sm"
                          className="text-xs"
                          onClick={() => setFormData({ ...formData, time: slot })}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <Textarea
                      placeholder="Special requests (allergies, occasion, seating preference...)"
                      value={formData.specialRequests}
                      onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="gradient"
                    className="w-full"
                    disabled={loading || !formData.time || !formData.date}
                  >
                    {loading ? "Booking..." : "Request Reservation"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    You'll receive a confirmation call/message from the restaurant
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TableBookingModal;

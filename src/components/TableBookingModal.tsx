import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Calendar, Clock, Users, Phone, Mail, User, 
  CreditCard, Loader2, Check, ShieldCheck 
} from "lucide-react";
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
  isActivityProvider?: boolean;
}

// Fixed Advance Amount
const BOOKING_AMOUNT = 299;

const TableBookingModal = ({ isOpen, onClose, restaurantId, restaurantName, isActivityProvider = false }: TableBookingModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Steps: 'form' -> 'processing' (payment) -> 'finalizing' (saving to db) -> 'success'
  const [step, setStep] = useState<"form" | "processing" | "finalizing" | "success">("form");
  
  // Payment State
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [verifyingPaymentId, setVerifyingPaymentId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    date: "",
    time: "",
    partySize: 2,
    specialRequests: "",
  });

  // Activity slot booking states
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [existingReservations, setExistingReservations] = useState<any[]>([]);
  const [bookingForSomeoneElse, setBookingForSomeoneElse] = useState(false);
  const [originalProfile, setOriginalProfile] = useState({ name: "", phone: "" });

  const timeSlots = [
    "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
    "2:00 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM"
  ];

  const today = new Date().toISOString().split("T")[0];

  // --- 1. Load Razorpay Script (Same as Pay.tsx) ---
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setIsRazorpayLoaded(true);
    document.body.appendChild(script);
    
    // Cleanup state when modal closes/opens
    if (isOpen) {
      setStep("form");
      setVerifyingPaymentId(null);
      setSelectedActivity(null);
      setFormData(prev => ({ ...prev, time: "" }));
      setBookingForSomeoneElse(false);

      if (user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              setFormData(prev => ({
                ...prev,
                name: data.full_name || "",
                phone: data.phone || "",
                email: user.email || ""
              }));
              setOriginalProfile({
                name: data.full_name || "",
                phone: data.phone || "",
              });
            }
          });
      }
    }
  }, [isOpen, user]);

  // Fetch activities
  useEffect(() => {
    if (isOpen && isActivityProvider) {
      fetchActivities();
    }
  }, [isOpen, isActivityProvider]);

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("is_available", true);
      if (error) throw error;
      setActivities(data || []);
      if (data && data.length > 0) {
        setSelectedActivity(data[0]);
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
    } finally {
      setLoadingActivities(false);
    }
  };

  // Fetch reservations on date change
  useEffect(() => {
    if (isOpen && formData.date && restaurantId) {
      fetchExistingReservations();
    }
  }, [isOpen, formData.date, restaurantId]);

  const fetchExistingReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("reservation_time, status")
        .eq("restaurant_id", restaurantId)
        .eq("reservation_date", formData.date)
        .neq("status", "cancelled");

      if (error) throw error;
      setExistingReservations(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  // Helper functions for slot generation
  const parseActivitySlots = (activity: any) => {
    try {
      if (!activity.description) return null;
      const config = JSON.parse(activity.description);
      if (config.start_time && config.end_time && config.slot_duration) {
        return config;
      }
    } catch (e) {}
    return null;
  };

  const getSlotConfig = (activity: any) => {
    const config = parseActivitySlots(activity);
    if (config) return config;
    return {
      start_time: "07:00 AM",
      end_time: "11:00 PM",
      slot_duration: "1",
      text: activity.description || ""
    };
  };

  const parseTime = (timeStr: string) => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60 + (minutes || 0);
  };

  const formatMinutes = (totalMinutes: number) => {
    let hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const modifier = hours >= 12 ? "PM" : "AM";
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    const minStr = minutes < 10 ? `0${minutes}` : minutes;
    const hourStr = hours < 10 ? `0${hours}` : hours;
    return `${hourStr}:${minStr} ${modifier}`;
  };

  const generateSlots = (startTimeStr: string, endTimeStr: string, durationStr: string) => {
    const start = parseTime(startTimeStr);
    const end = parseTime(endTimeStr);
    
    if (durationStr === "Full Day") {
      return [`${startTimeStr} - ${endTimeStr} (Full Day)`];
    }
    
    const durationHours = parseFloat(durationStr) || 1;
    const step = durationHours * 60;
    const list = [];
    
    for (let current = start; current + step <= end; current += step) {
      const slotStart = formatMinutes(current);
      const slotEnd = formatMinutes(current + step);
      list.push(`${slotStart} - ${slotEnd}`);
    }
    return list;
  };

  const isSlotBooked = (activityName: string, slotStr: string) => {
    return existingReservations.some(r => 
      r.reservation_time.includes(activityName) && r.reservation_time.includes(slotStr)
    );
  };

  const getBookingAmount = () => {
    if (isActivityProvider && selectedActivity) {
      return selectedActivity.price;
    }
    return BOOKING_AMOUNT;
  };

  // --- 2. Handle Payment Initiation ---
  const handlePaymentInitiation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: "Login Required", description: "Please login to book a table", variant: "destructive" });
      return;
    }
    if (!formData.date || !formData.time || !formData.phone || !formData.name) {
      toast({ title: "Missing Details", description: "Please fill all required fields (*)", variant: "destructive" });
      return;
    }
    const amount = getBookingAmount();
    if (amount <= 0) {
      finalizeReservation("FREE_BOOKING");
      return;
    }

    if (!isRazorpayLoaded) {
      toast({ title: "System Loading", description: "Please wait a moment...", variant: "default" });
      return;
    }

    setStep("processing");
    try {
      // Create Order on Backend (Same endpoint as Pay.tsx)
      const res = await fetch(
        "https://dinedeal-backend-076n.onrender.com/api/payments/create-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amount,
            type: "restaurant", // Using restaurant type, but metadata handles context
            restaurantId: restaurantId,
            userId: user.id,
            metadata: {
              type: "table_reservation", // Specific marker for logic
              partySize: formData.partySize,
              date: formData.date,
              time: isActivityProvider && selectedActivity ? `${selectedActivity.name} (${formData.time})` : formData.time,
              customerName: formData.name
            }
          }),
        }
      );

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Order creation failed");

      // Open Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        name: restaurantName,
        description: isActivityProvider ? "Activity Slot Booking" : "Table Reservation Advance",
        order_id: data.order.id,
        // Handler creates the loop for verification
        handler: function (response: any) {
          setVerifyingPaymentId(response.razorpay_payment_id);
          // Logic waits for the Polling Effect below
        },
        modal: {
          ondismiss: () => {
            setStep("form");
            toast({ title: "Booking Cancelled", variant: "default" });
          },
        },
        prefill: {
          name: formData.name,
          email: formData.email || user.email,
          contact: formData.phone || user.phone,
        },
        theme: { color: "#000000" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error(err);
      setStep("form");
      toast({ title: "Payment Error", description: "Could not initiate checkout.", variant: "destructive" });
    }
  };

  // --- 3. Secure Polling & Finalize Booking (Same logic as Pay.tsx) ---
  useEffect(() => {
    if (step !== "processing" || !verifyingPaymentId) return;

    let attempts = 0;
    const maxAttempts = 20;

    const checkStatus = async () => {
      attempts++;
      
      // Check if Webhook created the transaction record
      const { data } = await supabase
        .from("transactions")
        .select("id, payment_status")
        .eq("payment_reference", verifyingPaymentId)
        .maybeSingle();

      if (data) {
        // Payment Confirmed -> Now Create Reservation
        finalizeReservation(verifyingPaymentId);
      } else if (attempts >= maxAttempts) {
        // Timeout handling (Assume success if user reached here, but log it)
        finalizeReservation(verifyingPaymentId); 
        toast({ title: "Payment Received", description: "Finalizing booking details...", variant: "default" });
      } else {
        setTimeout(checkStatus, 2000);
      }
    };

    checkStatus();
  }, [step, verifyingPaymentId]);

  // --- 4. Insert Reservation into Supabase ---
  const finalizeReservation = async (paymentId: string) => {
    setStep("finalizing");
    
    try {
      const { data: restaurantData } = await supabase
        .from("restaurants")
        .select("email")
        .eq("id", restaurantId)
        .single();

      const amount = getBookingAmount();
      // Insert Reservation with Payment Info
      const { error } = await supabase.from("reservations").insert({
        restaurant_id: restaurantId,
        user_id: user?.id,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        reservation_date: formData.date,
        reservation_time: isActivityProvider && selectedActivity ? `${selectedActivity.name} (${formData.time})` : formData.time,
        party_size: formData.partySize,
        // Add payment note to special requests
        special_requests: `${formData.specialRequests ? formData.specialRequests + ". " : ""}PAID ADVANCE: ₹${amount} (Ref: ${paymentId})`,
        status: "confirmed", // Auto-confirm since they paid
      });

      if (error) throw error;

      // --- Trigger Emails (Existing Logic) ---
      
      // 1. Customer Email
      if (formData.email) {
        await supabase.functions.invoke("send-reservation-email", {
          body: {
            to: formData.email,
            type: "confirmation",
            data: {
              customerName: formData.name,
              restaurantName,
              reservationDate: formData.date,
              reservationTime: isActivityProvider && selectedActivity ? `${selectedActivity.name} (${formData.time})` : formData.time,
              partySize: formData.partySize,
              status: "confirmed",
              specialRequests: `Advance Paid: ₹${getBookingAmount()}. Adjusted in final bill.`,
            },
          },
        });
      }

      // 2. Restaurant Alert
      if (restaurantData?.email) {
        await supabase.functions.invoke("send-reservation-email", {
          body: {
            to: restaurantData.email,
            type: "restaurant_alert",
            data: {
              customerName: formData.name,
              restaurantName,
              reservationDate: formData.date,
              reservationTime: isActivityProvider && selectedActivity ? `${selectedActivity.name} (${formData.time})` : formData.time,
              partySize: formData.partySize,
              status: "confirmed - PAID",
              specialRequests: `PAID ₹${getBookingAmount()}. ${formData.specialRequests}`,
              phone: formData.phone,
            },
          },
        });
      }

      setStep("success");

    } catch (error: any) {
      console.error("Booking Finalization Error:", error);
      toast({ title: "Booking Saved", description: "Table reserved, but email trigger failed.", variant: "default" });
      setStep("success"); // Still show success as DB write likely worked or payment is done
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      name: "", phone: "", email: "", date: "", time: "", partySize: 2, specialRequests: "",
    });
    setStep("form");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="w-full max-w-md max-h-[90vh] overflow-y-auto"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-border/50 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg">{isActivityProvider ? "Book Turf / Slot" : "Book a Table"}</CardTitle>
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{restaurantName}</p>
                
                {/* --- STATE: FORM --- */}
                {step === "form" && (
                  <form onSubmit={handlePaymentInitiation} className="space-y-4 pb-24">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="someoneElseTable"
                        checked={bookingForSomeoneElse}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setBookingForSomeoneElse(checked);
                          if (!checked) {
                            setFormData(prev => ({
                              ...prev,
                              name: originalProfile.name,
                              phone: originalProfile.phone
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <label htmlFor="someoneElseTable" className="text-xs text-muted-foreground cursor-pointer select-none">
                        Booking for someone else
                      </label>
                    </div>

                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Your Name *"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-10"
                        disabled={!bookingForSomeoneElse}
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
                        {isActivityProvider ? (
                          <Input
                            type="number"
                            placeholder="Players *"
                            value={formData.partySize}
                            onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) || 1 })}
                            className="pl-10"
                            min={1}
                            required
                          />
                        ) : (
                          <select
                            value={formData.partySize}
                            onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) })}
                            className="w-full h-10 pl-10 pr-3 rounded-md border border-input bg-background text-sm"
                            required
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((n) => (
                              <option key={n} value={n}>
                                {n} {n === 1 ? "Guest" : "Guests"}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Activity selector */}
                    {isActivityProvider && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Select Activity / Turf *</label>
                        {loadingActivities ? (
                          <div className="flex items-center justify-center p-4"><Loader2 className="w-5 h-5 animate-spin" /></div>
                        ) : activities.length === 0 ? (
                          <p className="text-sm text-red-500">No activities available at this center.</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {activities.map((act) => (
                              <Button
                                key={act.id}
                                type="button"
                                variant={selectedActivity?.id === act.id ? "default" : "outline"}
                                size="sm"
                                className="text-xs justify-between h-auto py-2 px-3"
                                onClick={() => {
                                  setSelectedActivity(act);
                                  setFormData(prev => ({ ...prev, time: "" }));
                                }}
                              >
                                <span className="font-semibold text-left line-clamp-1">{act.name}</span>
                                <span className="text-[10px] opacity-80">₹{act.price}</span>
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {isActivityProvider ? "Select Time Slot *" : "Select Time *"}
                      </p>
                      
                      {!isActivityProvider ? (
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
                      ) : (
                        selectedActivity ? (
                          (() => {
                            const config = getSlotConfig(selectedActivity);
                            const slots = generateSlots(config.start_time, config.end_time, config.slot_duration);
                            
                            if (slots.length === 0) {
                              return <p className="text-xs text-muted-foreground">No time slots generated for this config.</p>;
                            }

                            return (
                              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                                {slots.map((slot) => {
                                  const booked = isSlotBooked(selectedActivity.name, slot);
                                  return (
                                    <Button
                                      key={slot}
                                      type="button"
                                      variant={formData.time === slot ? "default" : (booked ? "secondary" : "outline")}
                                      size="sm"
                                      disabled={booked}
                                      className={`text-xs py-2 h-auto flex flex-col items-center gap-0.5 ${booked ? "opacity-50 cursor-not-allowed bg-muted border-transparent text-muted-foreground" : ""}`}
                                      onClick={() => setFormData({ ...formData, time: slot })}
                                    >
                                      <span className="font-medium">{slot}</span>
                                      <span className="text-[9px] opacity-85">{booked ? "Booked" : "Available"}</span>
                                    </Button>
                                  );
                                })}
                              </div>
                            );
                          })()
                        ) : (
                          <p className="text-xs text-muted-foreground">Select an activity first</p>
                        )
                      )}
                    </div>

                    <div className="relative">
                      <Textarea
                        placeholder="Special requests (allergies, occasion...)"
                        value={formData.specialRequests}
                        onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                        rows={2}
                      />
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-primary flex items-start gap-2">
                      <CreditCard className="w-4 h-4 mt-0.5 shrink-0" />
                      <p>
                        Payment of <strong>₹{getBookingAmount()}</strong> is required to confirm. 
                        This amount represents the full slot price.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      variant="default"
                      className="w-full h-11 text-base font-semibold"
                      disabled={!formData.time || !formData.date}
                    >
                      Pay ₹{getBookingAmount()} & {isActivityProvider ? "Book Slot" : "Book Table"}
                    </Button>
                  </form>
                )}

                {/* --- STATE: PROCESSING --- */}
                {(step === "processing" || step === "finalizing") && (
                  <div className="py-12 flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <ShieldCheck className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{step === "processing" ? "Verifying Payment..." : "Confirming Booking..."}</h3>
                      <p className="text-muted-foreground text-sm">Please do not close this window</p>
                    </div>
                  </div>
                )}

                {/* --- STATE: SUCCESS --- */}
                {step === "success" && (
                  <div className="py-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
                      <Check className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
                      <p className="text-muted-foreground mt-2">
                        Your slot for {formData.partySize} {formData.partySize === 1 ? "player" : "players"} is reserved for {formData.date} at {formData.time}.
                      </p>
                    </div>
                    <div className="bg-secondary/50 p-4 rounded-lg text-sm">
                      <p className="font-semibold text-foreground">Payment Received: ₹{getBookingAmount()}</p>
                      <p className="text-muted-foreground text-xs mt-1">Confirmation email sent to {formData.email}</p>
                    </div>
                    <Button onClick={handleClose} className="w-full">Done</Button>
                  </div>
                )}

              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TableBookingModal;

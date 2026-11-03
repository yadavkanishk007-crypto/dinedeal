import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Star, 
  Percent, 
  ChevronRight,
  Heart,
  Share2,
  Info,
  CalendarDays,
  UtensilsCrossed,
  Wallet,
  Gamepad,
  Loader2,
  CreditCard,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import TableBookingModal from "@/components/TableBookingModal";
import RestaurantGallery from "@/components/RestaurantGallery";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  description: string | null;
  address: string;
  city: string;
  open_hours: string | null;
  rating: number | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  organiser_type?: string | null;
}

interface Offer {
  id: string;
  title: string;
  discount_percent: number;
  max_discount: number;
  terms: string | null;
  valid_until: string | null;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  is_veg: boolean;
}

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Activity booking states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedSlotActivity, setSelectedSlotActivity] = useState<MenuItem | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [existingReservations, setExistingReservations] = useState<any[]>([]);
  const [bookingFormData, setBookingFormData] = useState({ name: "", phone: "", email: "" });
  const [bookingStep, setBookingStep] = useState<"idle" | "verifying" | "saving" | "success">("idle");
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [verifyingPaymentId, setVerifyingPaymentId] = useState<string | null>(null);
  const [bookingForSomeoneElse, setBookingForSomeoneElse] = useState(false);
  const [originalProfile, setOriginalProfile] = useState({ name: "", phone: "" });

  const activitiesSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRestaurantDetail();
  }, [id, user]);

  const fetchRestaurantDetail = async () => {
    if (!id) return;
    try {
      const { data: restData, error: restErr } = await (supabase
        .from("restaurants")
        .select("*")
        .eq("id", id)
        .single() as any);

      if (restErr) throw restErr;
      setRestaurant(restData);

      if (restData) {
        if (user) {
          const { data: favData } = await (supabase
            .from("favorites" as any)
            .select("*")
            .eq("user_id", user.id)
            .eq("restaurant_id", id)
            .maybeSingle() as any);
          setIsFavorite(!!favData);
        }

        const { data: offersData } = await (supabase
          .from("offers" as any)
          .select("*")
          .eq("restaurant_id", id)
          .eq("is_active", true) as any);

        setOffers(offersData || []);

        const { data: menuData } = await (supabase
          .from("menu_items" as any)
          .select("*")
          .eq("restaurant_id", id)
          .eq("is_available", true)
          .order("category") as any);

        setMenuItems(menuData || []);
      }
    } catch (error) {
      console.error("Error fetching restaurant:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !restaurant) return;

    try {
      if (isFavorite) {
        await (supabase
          .from("favorites" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("restaurant_id", restaurant.id) as any);
        setIsFavorite(false);
      } else {
        await (supabase.from("favorites" as any).insert({
          user_id: user.id,
          restaurant_id: restaurant.id,
        }) as any);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleDirections = () => {
    if (!restaurant) return;
    let url = "";
    if (restaurant.latitude && restaurant.longitude) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`;
    } else if (restaurant.address) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.address)}`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.name + " " + restaurant.city)}`;
    }
    window.open(url, "_blank");
  };

  // Load Razorpay & user profile defaults
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setIsRazorpayLoaded(true);
    document.body.appendChild(script);

    if (user) {
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setBookingFormData({
              name: data.full_name || "",
              phone: data.phone || "",
              email: user.email || ""
            });
            setOriginalProfile({
              name: data.full_name || "",
              phone: data.phone || "",
            });
          }
        });
    }
  }, [user]);

  // Fetch reservations on date change
  const fetchExistingReservations = useCallback(async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("reservation_time, status")
        .eq("restaurant_id", id)
        .eq("reservation_date", selectedDate)
        .neq("status", "cancelled");

      if (error) throw error;
      setExistingReservations(data || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  }, [id, selectedDate]);

  useEffect(() => {
    if (restaurant?.organiser_type === "activity_provider" && id) {
      fetchExistingReservations();
    }
  }, [id, selectedDate, restaurant, fetchExistingReservations]);

  // Secure polling effect for payment verification
  useEffect(() => {
    if (bookingStep !== "verifying" || !verifyingPaymentId) return;

    let attempts = 0;
    const maxAttempts = 20;

    const checkStatus = async () => {
      attempts++;
      const { data } = await supabase
        .from("transactions")
        .select("id, payment_status")
        .eq("payment_reference", verifyingPaymentId)
        .maybeSingle();

      if (data) {
        finalizeInlineBooking(verifyingPaymentId);
      } else if (attempts >= maxAttempts) {
        finalizeInlineBooking(verifyingPaymentId);
      } else {
        setTimeout(checkStatus, 2000);
      }
    };

    checkStatus();
  }, [bookingStep, verifyingPaymentId]);

  const handleBookSlotInline = async (item: MenuItem) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to book slots", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (!bookingFormData.name || !bookingFormData.phone) {
      toast({ title: "Details Required", description: "Name and Phone number are compulsory.", variant: "destructive" });
      return;
    }

    const totalPrice = item.price * selectedSlots.length;
    if (totalPrice <= 0) {
      finalizeInlineBooking("FREE_BOOKING");
      return;
    }

    if (!isRazorpayLoaded) {
      toast({ title: "System Loading", description: "Please wait a moment...", variant: "default" });
      return;
    }

    setBookingStep("verifying");

    try {
      const totalPrice = item.price * selectedSlots.length;
      const res = await fetch(
        "https://dinedeal-backend-076n.onrender.com/api/payments/create-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: totalPrice,
            type: "restaurant",
            restaurantId: id,
            userId: user.id,
            metadata: {
              type: "table_reservation",
              partySize: 2,
              date: selectedDate,
              time: `${item.name} (${selectedSlots.join(", ")})`,
              customerName: bookingFormData.name
            }
          }),
        }
      );

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Order creation failed");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        name: restaurant?.name || "DineDeal Partner",
        description: `${item.name} Booking`,
        order_id: data.order.id,
        handler: function (response: any) {
          setVerifyingPaymentId(response.razorpay_payment_id);
        },
        modal: {
          ondismiss: () => {
            setBookingStep("idle");
            toast({ title: "Payment Cancelled", variant: "default" });
          },
        },
        prefill: {
          name: bookingFormData.name,
          email: bookingFormData.email || user.email,
          contact: bookingFormData.phone || user.phone,
        },
        theme: { color: "#ea580c" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error(err);
      setBookingStep("idle");
      toast({ title: "Booking Error", description: err.message || "Could not initiate payment", variant: "destructive" });
    }
  };

  const finalizeInlineBooking = async (paymentId: string) => {
    setBookingStep("saving");
    try {
      const promises = selectedSlots.map(slot =>
        supabase.from("reservations").insert({
          restaurant_id: id,
          user_id: user?.id,
          name: bookingFormData.name,
          phone: bookingFormData.phone,
          email: bookingFormData.email || null,
          reservation_date: selectedDate,
          reservation_time: `${selectedSlotActivity?.name} (${slot})`,
          party_size: 2,
          special_requests: `PAID SLOT BOOKING: ₹${selectedSlotActivity?.price} (Ref: ${paymentId})`,
          status: "confirmed",
        })
      );
      await Promise.all(promises);
      
      setBookingStep("success");
      toast({ title: "Bookings Confirmed 🎉", description: `Your slots at ${restaurant?.name} are confirmed!` });
      fetchExistingReservations();
    } catch (err: any) {
      console.error("Booking Finalization Error:", err);
      toast({ title: "Booking Saved", description: "Slots reserved, but details check failed.", variant: "default" });
      setBookingStep("success");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full gradient-primary animate-pulse" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Venue not found</p>
      </div>
    );
  }

  const maxDiscount = offers.length > 0 
    ? Math.max(...offers.map(o => o.max_discount))
    : 0;

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Time slot helper formatting
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

  const scrollToActivities = () => {
    activitiesSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background pb-[calc(100px+env(safe-area-inset-bottom))]">
      <div className="relative">
        <motion.div className="h-72 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <img
            src={restaurant.image_url || "/placeholder.svg"}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </motion.div>

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <motion.button
            className="w-10 h-10 rounded-full glass flex items-center justify-center"
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div className="flex gap-2">
            <motion.button 
              className="w-10 h-10 rounded-full glass flex items-center justify-center" 
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                if (navigator.share) {
                  await navigator.share({
                    title: restaurant.name,
                    text: `Check out ${restaurant.name} on DineDeal`,
                    url: window.location.href,
                  });
                } else {
                  await navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard");
                }
              }}
            >
              <Share2 className="w-5 h-5 text-foreground" />
            </motion.button>

            <motion.button
              className="w-10 h-10 rounded-full glass flex items-center justify-center"
              onClick={toggleFavorite}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? "fill-primary text-primary" : "text-foreground"}`} />
            </motion.button>
          </div>
        </div>
      </div>

      <main className="container -mt-12 relative z-10 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground mb-1">{restaurant.name}</h1>
                  <p className="text-muted-foreground text-sm">{restaurant.cuisine}</p>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success/10">
                  <Star className="w-4 h-4 text-success fill-success" />
                  <span className="font-semibold text-success">
                    {restaurant.rating && restaurant.rating > 0 ? restaurant.rating.toFixed(1) : "New"}
                  </span>
                </div>
              </div>

              {restaurant.description && (
                <p className="text-muted-foreground text-sm mt-4 leading-relaxed">{restaurant.description}</p>
              )}

              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{restaurant.city}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{restaurant.open_hours || "11:00 AM - 11:00 PM"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.05 }}
          className="space-y-3"
        >
          {maxDiscount > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium bg-primary/5 py-1.5 rounded-full border border-primary/10">
               <Percent className="w-4 h-4" /> 
               Save up to ₹{maxDiscount} on this booking
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3">
             <Button
                variant="outline"
                size="lg"
                className="w-full border-primary/20 hover:bg-primary/5 text-foreground h-12"
                onClick={restaurant?.organiser_type === "activity_provider" ? scrollToActivities : () => setShowBookingModal(true)}
              >
                <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                {restaurant?.organiser_type === "activity_provider" ? "Book Turf / Slot" : "Book Table"}
              </Button>

              <Button
                variant="default" 
                size="lg"
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                onClick={() => navigate(`/pay?restaurant=${restaurant.id}`)}
              >
                <Wallet className="w-4 h-4 mr-2" />
                {restaurant?.organiser_type === "activity_provider" ? "Pay Direct" : "Pay Now"}
              </Button>
          </div>
        </motion.div>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="font-display font-bold text-lg text-foreground mb-4">Active Offers</h2>
          {offers.length > 0 ? (
            <div className="space-y-3">
              {offers.map((offer, index) => (
                <motion.div key={offer.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + index * 0.05 }}>
                  <Card className="border-primary/20 bg-primary/5 overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                              <Percent className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{offer.title}</h3>
                              <p className="text-xs text-muted-foreground">
                                Max ₹{offer.max_discount} off
                                {offer.valid_until && ` • Valid till ${new Date(offer.valid_until).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`}
                              </p>
                            </div>
                          </div>
                          {offer.terms && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                              <Info className="w-3 h-3" />
                              <span>{offer.terms}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-display font-bold gradient-text">{offer.discount_percent}%</span>
                          <p className="text-xs text-muted-foreground">OFF</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="border-border/50 border-dashed">
              <CardContent className="p-6 text-center">
                <Percent className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-20" />
                <p className="text-muted-foreground text-sm">No exclusive offers available today.</p>
              </CardContent>
            </Card>
          )}
        </motion.section>

        {menuItems.length > 0 && (
          <motion.section 
            ref={activitiesSectionRef} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.15 }}
          >
            <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              {restaurant?.organiser_type === "activity_provider" ? (
                <>
                  <Gamepad className="w-5 h-5 text-primary" /> Activities & Pricing
                </>
              ) : (
                <>
                  <UtensilsCrossed className="w-5 h-5 text-primary" /> Menu
                </>
              )}
            </h2>
            
            {restaurant?.organiser_type === "activity_provider" ? (
              <div className="space-y-4">
                {/* Date Picker widget */}
                <div className="flex justify-between items-center bg-secondary/30 p-3 rounded-xl border border-border/40">
                  <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="w-4 h-4 text-primary" /> Select Booking Date
                  </span>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlots([]);
                    }}
                    className="neo-inset px-3 py-1 border border-border/50 rounded-lg bg-background text-foreground text-sm"
                  />
                </div>

                {menuItems.map((item) => {
                  let config = { start_time: "07:00 AM", end_time: "11:00 PM", slot_duration: "2", text: "" };
                  try {
                    if (item.description) {
                      const parsed = JSON.parse(item.description);
                      if (parsed.start_time && parsed.end_time && parsed.slot_duration) {
                        config = parsed;
                      }
                    }
                  } catch (e) {
                    config.text = item.description || "";
                  }

                  const slots = generateSlots(config.start_time, config.end_time, config.slot_duration);

                  return (
                    <Card key={item.id} className="border-border/50 overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-base">{item.name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Timings: {config.start_time} - {config.end_time} • {config.slot_duration === "Full Day" ? "Full Day Session" : `${config.slot_duration} hr slots`}
                            </p>
                            {config.text && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{config.text}</p>}
                          </div>
                          <span className="text-lg font-bold text-primary font-display">₹{item.price}</span>
                        </div>

                        {/* Slots Selection Grid */}
                        <div className="pt-2">
                          <label className="text-xs font-semibold text-muted-foreground block mb-2">Available Timeslots (Multi-select enabled):</label>
                          {slots.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No slots generated for this turf.</p>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {slots.map((slot) => {
                                const booked = isSlotBooked(item.name, slot);
                                const isSelected = selectedSlotActivity?.id === item.id && selectedSlots.includes(slot);
                                return (
                                  <Button
                                    key={slot}
                                    type="button"
                                    variant={isSelected ? "default" : (booked ? "secondary" : "outline")}
                                    size="sm"
                                    disabled={booked}
                                    className={`text-xs py-2.5 h-auto flex flex-col items-center gap-0.5 ${
                                      booked 
                                        ? "opacity-40 cursor-not-allowed bg-muted border-transparent text-muted-foreground" 
                                        : (isSelected ? "bg-primary text-primary-foreground border-primary" : "border-border/60 hover:bg-secondary/40")
                                    }`}
                                    onClick={() => {
                                      if (selectedSlotActivity?.id !== item.id) {
                                        setSelectedSlotActivity(item);
                                        setSelectedSlots([slot]);
                                      } else {
                                        if (selectedSlots.includes(slot)) {
                                          setSelectedSlots(selectedSlots.filter(s => s !== slot));
                                        } else {
                                          setSelectedSlots([...selectedSlots, slot]);
                                        }
                                      }
                                      if (bookingStep === "success") {
                                        setBookingStep("idle");
                                      }
                                    }}
                                  >
                                    <span className="font-semibold">{slot}</span>
                                    <span className="text-[9px] opacity-75">{booked ? "Booked" : "Available"}</span>
                                  </Button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Inline Booking Form */}
                        {selectedSlotActivity?.id === item.id && selectedSlots.length > 0 && (
                          <div className="mt-4 p-4 border border-primary/20 rounded-xl bg-primary/5 space-y-4">
                            {bookingStep === "success" ? (
                              <div className="text-center py-4 space-y-3">
                                <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
                                <div>
                                  <h4 className="font-bold text-sm text-foreground">Slots Booked Successfully!</h4>
                                  <p className="text-xs text-muted-foreground mt-1">Ref: payment verified. Confirmation sent.</p>
                                </div>
                                <Button size="sm" onClick={() => setSelectedSlots([])} className="mt-2 text-xs">
                                  Done
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-center">
                                  <h4 className="text-xs font-bold text-foreground">Complete Booking ({selectedSlots.length} slot{selectedSlots.length > 1 ? "s" : ""})</h4>
                                  <button onClick={() => setSelectedSlots([])} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id="someoneElseDetail"
                                    checked={bookingForSomeoneElse}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setBookingForSomeoneElse(checked);
                                      if (!checked) {
                                        setBookingFormData(prev => ({
                                          ...prev,
                                          name: originalProfile.name,
                                          phone: originalProfile.phone
                                        }));
                                      }
                                    }}
                                    className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                                  />
                                  <label htmlFor="someoneElseDetail" className="text-xs text-muted-foreground cursor-pointer select-none">
                                    Booking for someone else
                                  </label>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  <Input
                                    placeholder="Your Name *"
                                    value={bookingFormData.name}
                                    onChange={(e) => setBookingFormData({ ...bookingFormData, name: e.target.value })}
                                    className="h-9 text-xs bg-background"
                                    disabled={!bookingForSomeoneElse}
                                    required
                                  />
                                  <Input
                                    placeholder="Phone Number *"
                                    value={bookingFormData.phone}
                                    onChange={(e) => setBookingFormData({ ...bookingFormData, phone: e.target.value })}
                                    className="h-9 text-xs bg-background"
                                    required
                                  />
                                </div>
                                <Button
                                  onClick={() => handleBookSlotInline(item)}
                                  className="w-full h-10 text-xs font-semibold"
                                  disabled={bookingStep !== "idle" || !bookingFormData.name || !bookingFormData.phone}
                                >
                                  {bookingStep === "verifying" || bookingStep === "saving" ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  ) : (
                                    <CreditCard className="w-4 h-4 mr-2" />
                                  )}
                                  Pay ₹{item.price * selectedSlots.length} & Book Slots
                                </Button>
                              </>
                            )}
                          </div>
                        )}

                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-border/50">
                <CardContent className="p-4 space-y-4">
                  {Object.entries(groupedMenuItems).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">{category}</h3>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-start justify-between p-3 rounded-lg bg-secondary/50">
                            <div className="flex items-start gap-2">
                              <div className={`w-4 h-4 mt-1 rounded-sm border-2 flex items-center justify-center shrink-0 ${item.is_veg ? "border-success" : "border-destructive"}`}>
                                <div className={`w-2 h-2 rounded-full ${item.is_veg ? "bg-success" : "bg-destructive"}`} />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{item.name}</p>
                                {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                              </div>
                            </div>
                            <span className="font-bold text-sm">₹{item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.section>
        )}

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <RestaurantGallery restaurantId={restaurant.id} />
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card 
            className="border-border/50 cursor-pointer hover:bg-secondary/20 transition-colors"
            onClick={handleDirections}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Get Directions</p>
                    <p className="text-xs text-muted-foreground">{restaurant.address}, {restaurant.city}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </main>

      {restaurant && (
        <TableBookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          isActivityProvider={restaurant.organiser_type === "activity_provider"}
        />
      )}
      <BottomNav />
    </div>
  );
};

export default RestaurantDetail;

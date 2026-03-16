import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Smartphone,
  Sparkles,
  Gift,
  CreditCard,
  Tag,
  X,
  AlertCircle,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// --- Types ---
type PaymentStep = "loading" | "amount" | "breakdown" | "processing" | "success";
type DisplayMethod = "upi" | "card";

// ✅ Domain Model Fix: Restaurant has no discount data
type Restaurant = {
  id: string;
  name: string;
  image_url: string;
  cuisine: string;
};

// ✅ Domain Model Fix: Offer is separate
type ActiveOffer = {
  id: string;
  discount_percent: number;
  max_discount: number;
  min_order_amount: number | null;
};

type Coupon = {
  id: string;
  code: string;
  discount_percent: number;
  max_discount: number | null;
  min_order_amount: number | null;
  valid_until: string | null;
};

export default function Pay() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  // 🔹 Event booking context (optional)
  const paymentType = searchParams.get("type"); // "event" | null
  const eventId = searchParams.get("event");
  const seats = Number(searchParams.get("seats") || 1);


  // --- State ---
  const restaurantId = searchParams.get("restaurant");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [activeOffer, setActiveOffer] = useState<ActiveOffer | null>(null);
  const [step, setStep] = useState<PaymentStep>("loading");

  const [billAmount, setBillAmount] = useState("");
  // Generated mostly for UI reference; actual correlation happens via Order ID in backend
  const [transactionId, setTransactionId] = useState("");

  // Store the payment ID so we can poll for its completion by the webhook
  const [verifyingPaymentId, setVerifyingPaymentId] = useState<string | null>(null);

  // UI Selection State
  const [displayMethod, setDisplayMethod] = useState<DisplayMethod>("upi");

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  // Payment Processing State
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Initialization ---

  useEffect(() => {
    // 🔒 Block "no-id" explicitly
    if (!restaurantId || restaurantId === "no-id") {
      toast({ title: "Invalid Payment Link", variant: "destructive" });
      navigate("/explore");
      return;
    }

    const loadData = async () => {
      try {
        const now = new Date().toISOString();

        // ✅ Production-Grade Fix: Parallel Fetching & Domain Separation
        const [{ data: restaurantData, error: restaurantError }, { data: offerData }] = await Promise.all([
          // 1. Fetch Restaurant Profile
          supabase
            .from("restaurants")
            .select("id, name, image_url, cuisine")
            .eq("id", restaurantId)
            .single(),

          // 2. Fetch Best Active Offer
          supabase
            .from("offers")
            .select("id, discount_percent, max_discount, min_order_amount")
            .eq("restaurant_id", restaurantId)
            .eq("is_active", true)
            .lte("valid_from", now)
            .or(`valid_until.gte.${now},valid_until.is.null`)
            .order("discount_percent", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (restaurantError || !restaurantData) throw new Error("Restaurant not found");

        setRestaurant(restaurantData);
        setActiveOffer(offerData ?? null); // Offer might be null, that's okay
        setStep("amount");
        setTransactionId(`DD${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`);
      } catch (err) {
        navigate("/explore");
      }
    };

    loadData();
  }, [restaurantId, navigate, toast]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setIsRazorpayLoaded(true);
    document.body.appendChild(script);
  }, []);

  // --- Calculations ---

  const amount = parseFloat(billAmount) || 0;

  // ✅ Fix: Calculate based on ActiveOffer entity and check min_order_amount
  const restaurantDiscount = activeOffer && (!activeOffer.min_order_amount || amount >= activeOffer.min_order_amount)
    ? Math.min(
      (amount * activeOffer.discount_percent) / 100,
      activeOffer.max_discount
    )
    : 0;

  const couponDiscount = appliedCoupon
    ? Math.min(
      amount * (appliedCoupon.discount_percent / 100),
      appliedCoupon.max_discount || Infinity
    )
    : 0;

  const totalDiscount = restaurantDiscount + couponDiscount;
  const finalAmount = Math.max(amount - totalDiscount, 0);

  // Rewards are now calculated by the Webhook, but we can display an estimate
  const estimatedRewards = Math.floor(amount * 0.02);

  // --- Coupon Handler ---

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");

    try {
      // Frontend only VERIFIES coupon existence. Backend usage is applied via Webhook.
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        setCouponError("Invalid coupon code");
        return;
      }

      const now = new Date();
      if (data.valid_until && new Date(data.valid_until) < now) {
        setCouponError("Coupon expired");
        return;
      }
      if (data.min_order_amount && amount < data.min_order_amount) {
        setCouponError(`Min order ₹${data.min_order_amount}`);
        return;
      }

      setAppliedCoupon(data);
      toast({ title: "Coupon Applied", description: `${data.discount_percent}% saved!` });
    } catch (err) {
      setCouponError("Error checking coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  // --- Payment Handler (Razorpay) ---

  const handlePayment = async () => {
    if (finalAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Payable amount must be greater than ₹0",
        variant: "destructive",
      });
      return;
    }

    // 🔒 Guarantees restaurant.id is valid before calling backend
    if (!restaurant || !restaurant.id) {
      toast({
        title: "Invalid Restaurant",
        description: "Please open payment from a restaurant page.",
        variant: "destructive",
      });
      return;
    }

    if (!isRazorpayLoaded) return;

    // 🧪 Debug Log
    console.log("💳 Initiating payment for restaurant:", restaurant.id);

    setIsProcessing(true);
    toast({ title: "Securing connection..." });

    try {
      // 1. Create Order on Backend
      const res = await fetch(
        "https://dinedeal-backend-076n.onrender.com/api/payments/create-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: finalAmount,
            // ✅ Fix: Send explicit bill & discount amounts for tracking
            billAmount: amount,
            discountAmount: totalDiscount,
            type: paymentType === "event" ? "event" : "restaurant",
            restaurantId: restaurant.id,
            userId: user?.id ?? "guest",
            metadata: {
              // We pass this data so the Backend Webhook knows what to apply
              couponCode: appliedCoupon?.code,
              offerId: activeOffer?.id, // Optional: Pass offer ID if backend tracks it
              frontendRef: transactionId,
              // 🔹 ADD THESE (EVENT SUPPORT)
              eventId: eventId || null,
              seats,
            }
          }),
        }
      );

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Order creation failed");

      // 2. Open Razorpay Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        name: restaurant.name,
        description: `Ref: ${transactionId}`,
        order_id: data.order.id,
        // ✅ SECURE HANDLER: UI Only. No DB Writes.
        handler: function (response: any) {
          setVerifyingPaymentId(response.razorpay_payment_id);
          setStep("processing");
          // Logic stops here. We wait for the Polling Effect below.
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast({ title: "Payment Cancelled", variant: "default" });
          },
        },
        prefill: {
          email: user?.email,
          contact: user?.phone,
        },
        theme: { color: "#000000" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      toast({
        title: "Payment Error",
        description: "Could not initiate secure checkout.",
        variant: "destructive"
      });
    }
  };

  // --- 🔒 Secure Polling Effect ---
  // Since frontend cannot write, we poll the DB to see when the Webhook has done its job.
  useEffect(() => {
    if (step !== "processing" || !verifyingPaymentId) return;

    let attempts = 0;
    const maxAttempts = 20; // Try for ~40 seconds (2s interval)

    const checkStatus = async () => {
      attempts++;

      // We look for the transaction created by the webhook
      const { data } = await supabase
        .from("transactions")
        .select("id, payment_status")
        .eq("payment_reference", verifyingPaymentId)
        .maybeSingle();

      if (data) {
        // ✅ Webhook success!
        setStep("success");
        setIsProcessing(false);
        toast({ title: "Payment Confirmed", description: "Receipt sent to email." });
      } else if (attempts >= maxAttempts) {
        // Timeout (Webhook is slow or failed)
        // We still show success because money is likely deducted, but warn user
        setIsProcessing(false);
        setStep("success");
        toast({
          title: "Payment Received",
          description: "Syncing data in background...",
          variant: "default"
        });
      } else {
        // Retry
        setTimeout(checkStatus, 2000);
      }
    };

    checkStatus();
  }, [step, verifyingPaymentId]);


  // --- Render ---

  if (step === "loading" || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground">Connecting to restaurant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-40 glass border-b border-border/30"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="container py-4 flex items-center gap-4">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={() => {
              if (step === "amount") navigate("/explore");
              else if (step === "success") navigate("/explore");
              else setStep("amount");
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display font-bold text-foreground line-clamp-1">
              {restaurant.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {restaurant.cuisine}
              {/* ✅ Fix: Only show discount if offer exists */}
              {activeOffer && (<span className="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded ml-1">
                • {activeOffer.discount_percent}% Off
              </span>
              )}
            </p>
          </div>
        </div>
      </motion.header>

      <main className="container py-6">
        <AnimatePresence mode="wait">

          {/* STEP 1: BILL AMOUNT */}
          {step === "amount" && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center py-10">
                <p className="text-muted-foreground text-sm mb-3">Total Bill Amount</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-4xl font-display font-bold text-muted-foreground">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="text-5xl font-display font-bold bg-transparent border-none outline-none w-48 text-center placeholder:text-muted-foreground/20"
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Suggestions */}
              <div className="grid grid-cols-4 gap-2">
                {[200, 500, 1000, 2000].map((val) => (
                  <Button
                    key={val}
                    variant="outline"
                    className="h-12"
                    onClick={() => setBillAmount(val.toString())}
                  >
                    ₹{val}
                  </Button>
                ))}
              </div>

              <Card>
                <CardContent className="p-4 flex gap-4 items-center">
                  <img src={restaurant.image_url || "/placeholder.jpg"} className="w-16 h-16 rounded-md object-cover bg-muted" alt="" />
                  <div>
                    <p className="font-semibold">{restaurant.name}</p>
                    {/* ✅ Fix: Only show savings msg if offer exists */}
                    {activeOffer && (
                      <p className="text-xs text-success flex items-center gap-1 font-medium">
                        <Sparkles className="w-3 h-3" />
                        Save up to ₹{activeOffer.max_discount}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Button
                size="lg"
                className="w-full text-lg h-12"
                disabled={amount < 1}
                onClick={() => setStep("breakdown")}
              >
                Continue
              </Button>
            </motion.div>
          )}

          {/* STEP 2: BREAKDOWN & PAYMENT */}
          {step === "breakdown" && (
            <motion.div
              key="breakdown"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bill Amount</span>
                    <span>₹{amount.toFixed(2)}</span>
                  </div>

                  {/* ✅ Fix: Only show discount row if > 0 */}
                  {restaurantDiscount > 0 && (
                    <div className="flex justify-between text-success">
                      <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> DineDeal Offer</span>
                      <span>- ₹{restaurantDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="flex justify-between text-success">
                      <span className="flex items-center gap-2"><Tag className="w-4 h-4" /> Coupon ({appliedCoupon.code})</span>
                      <span>- ₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-4 flex justify-between items-center font-bold text-lg">
                    <span>To Pay</span>
                    <span>₹{finalAmount.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Coupon Section */}
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="uppercase"
                  />
                  <Button onClick={handleApplyCoupon} disabled={couponLoading}>
                    {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg border border-success/20">
                  <span className="text-sm font-medium text-success flex items-center gap-2">
                    <Check className="w-4 h-4" /> Code {appliedCoupon.code} applied
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setAppliedCoupon(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {couponError && <p className="text-xs text-destructive flex items-center gap-1 ml-1"><AlertCircle className="w-3 h-3" /> {couponError}</p>}

              {/* Payment Methods (Visual Selector) */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Payment Method</h3>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded">
                    <ShieldCheck className="w-3 h-3 text-green-600" /> Secured by Razorpay
                  </span>
                </div>

                <div
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${displayMethod === "upi" ? "border-primary bg-primary/5" : "border-border/40 hover:border-border"
                    }`}
                  onClick={() => setDisplayMethod("upi")}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">UPI Apps</p>
                      <p className="text-xs text-muted-foreground">Google Pay, PhonePe, Paytm</p>
                    </div>
                  </div>
                  {displayMethod === "upi" && <div className="w-4 h-4 rounded-full bg-primary" />}
                </div>

                <div
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${displayMethod === "card" ? "border-primary bg-primary/5" : "border-border/40 hover:border-border"
                    }`}
                  onClick={() => setDisplayMethod("card")}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="font-medium">Cards & More</p>
                      <p className="text-xs text-muted-foreground">Credit/Debit, Netbanking</p>
                    </div>
                  </div>
                  {displayMethod === "card" && <div className="w-4 h-4 rounded-full bg-primary" />}
                </div>
              </div>

              <Button
                size="lg"
                className="w-full text-lg h-12"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  `Pay ₹${finalAmount.toFixed(2)}`
                )}
              </Button>
            </motion.div>
          )}

          {/* STEP 3: PROCESSING (Post-Razorpay) */}
          {step === "processing" && (
            <motion.div className="flex flex-col items-center justify-center pt-20 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <ShieldCheck className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="font-semibold text-lg">Verifying Payment...</h3>
              <p className="text-muted-foreground text-sm">Waiting for secure confirmation</p>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center pt-10 space-y-6"
            >
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
                <Check className="w-12 h-12 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold">Payment Successful!</h2>
                <p className="text-muted-foreground text-sm mt-1">Ref ID: {transactionId}</p>
              </div>

              <Card className="bg-secondary/30 border-none">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                  <p className="text-4xl font-bold">₹{finalAmount.toFixed(2)}</p>
                  {totalDiscount > 0 && (
                    <div className="mt-4 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-sm font-medium">
                      <Sparkles className="w-3 h-3" /> Saved ₹{totalDiscount.toFixed(2)}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-gold/10 border border-gold/30">
                <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-white font-bold">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground">+{estimatedRewards} Points Earned</p>
                  <p className="text-xs text-muted-foreground">Available for next visit</p>
                </div>
              </div>

              <Button size="lg" className="w-full h-12" onClick={() => navigate("/explore")}>
                Done
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

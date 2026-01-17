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

type Restaurant = {
  id: string;
  name: string;
  discount: number;
  max_discount: number;
  image_url: string;
  cuisine: string;
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

  // --- State ---
  const restaurantId = searchParams.get("restaurant");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [step, setStep] = useState<PaymentStep>("loading");

  const [billAmount, setBillAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
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
    // Validate restaurant ID
    if (!restaurantId || restaurantId === "no-id" || restaurantId.trim() === "") {
      toast({
        title: "Invalid Payment Link",
        description: "Please select a restaurant first.",
        variant: "destructive",
      });
      navigate("/explore");
      return;
    }

    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("id, name, cuisine, discount, max_discount, image_url")
          .eq("id", restaurantId)
          .eq("is_active", true)
          .maybeSingle();

        if (error) {
          console.error("Supabase error:", error);
          throw new Error("Failed to load restaurant data");
        }

        if (!data) {
          throw new Error("Restaurant not found or inactive");
        }

        setRestaurant(data);
        setStep("amount");
        setTransactionId(
          `DD${Date.now().toString().slice(-6)}${Math.random()
            .toString(36)
            .substr(2, 4)
            .toUpperCase()}`
        );
      } catch (err) {
        console.error("Load restaurant error:", err);
        toast({
          title: "Restaurant Not Available",
          description: err instanceof Error ? err.message : "Please try again",
          variant: "destructive",
        });
        navigate("/explore");
      }
    };

    loadData();
  }, [restaurantId, navigate, toast]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setIsRazorpayLoaded(true);
    script.onerror = () => {
      toast({
        title: "Payment System Unavailable",
        description: "Could not load payment gateway. Please refresh.",
        variant: "destructive",
      });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [toast]);

  // --- Calculations ---
  const amount = parseFloat(billAmount) || 0;

  const restaurantDiscount = restaurant
    ? Math.min(
        amount * ((restaurant.discount || 0) / 100),
        restaurant.max_discount ?? Infinity
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
  const estimatedRewards = Math.floor(amount * 0.02);

  // --- Coupon Handler ---
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Coupon fetch error:", error);
        setCouponError("Error checking coupon");
        return;
      }

      if (!data) {
        setCouponError("Invalid coupon code");
        return;
      }

      const now = new Date();
      if (data.valid_until && new Date(data.valid_until) < now) {
        setCouponError("Coupon has expired");
        return;
      }

      if (data.min_order_amount && amount < data.min_order_amount) {
        setCouponError(`Minimum order ₹${data.min_order_amount} required`);
        return;
      }

      setAppliedCoupon(data);
      setCouponCode("");
      toast({
        title: "Coupon Applied Successfully",
        description: `${data.discount_percent}% discount unlocked!`,
      });
    } catch (err) {
      console.error("Coupon error:", err);
      setCouponError("Error applying coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  // --- Payment Handler (Razorpay) ---
  const handlePayment = async () => {
    if (!restaurant?.id) {
      toast({
        title: "Invalid Restaurant",
        description: "Please restart the payment process.",
        variant: "destructive",
      });
      return;
    }

    if (!isRazorpayLoaded) {
      toast({
        title: "Payment Gateway Loading",
        description: "Please wait a moment...",
        variant: "default",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsProcessing(true);
    toast({ title: "Initializing secure payment..." });

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://dinedeal-backend-076n.onrender.com";
      const res = await fetch(`${backendUrl}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(finalAmount * 100), // Convert to paise
          restaurantId: restaurant.id,
          userId: user.id,
          metadata: {
            couponCode: appliedCoupon?.code,
            frontendRef: transactionId,
            billAmount: amount,
            discount: totalDiscount,
          },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Backend error:", res.status, errorText);
        throw new Error(
          res.status === 404
            ? "Payment service unavailable. Please contact support."
            : "Failed to create payment order"
        );
      }

      const data = await res.json();

      if (!data.success || !data.order?.id) {
        throw new Error(data.message || "Invalid order response");
      }

      // Open Razorpay Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        name: restaurant.name,
        description: `Order Ref: ${transactionId}`,
        order_id: data.order.id,
        handler: function (response: any) {
          console.log("Payment success:", response);
          setVerifyingPaymentId(response.razorpay_payment_id);
          setStep("processing");
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast({ title: "Payment Cancelled", variant: "default" });
          },
        },
        prefill: {
          email: user.email,
          contact: user.phone || "",
        },
        theme: { color: "#000000" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response.error);
        setIsProcessing(false);
        toast({
          title: "Payment Failed",
          description: response.error.description || "Please try again",
          variant: "destructive",
        });
      });

      rzp.open();
    } catch (err) {
      console.error("Payment initialization error:", err);
      setIsProcessing(false);
      toast({
        title: "Payment Error",
        description: err instanceof Error ? err.message : "Could not initiate payment",
        variant: "destructive",
      });
    }
  };

  // --- Polling Effect for Payment Verification ---
  useEffect(() => {
    if (step !== "processing" || !verifyingPaymentId) return;

    let attempts = 0;
    const maxAttempts = 30; // 60 seconds total
    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      attempts++;

      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("id, payment_status")
          .eq("payment_reference", verifyingPaymentId)
          .maybeSingle();

        if (error) {
          console.error("Transaction check error:", error);
        }

        if (data) {
          clearInterval(intervalId);
          setStep("success");
          setIsProcessing(false);
          toast({
            title: "Payment Confirmed",
            description: "Your transaction is complete!",
          });
        } else if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          setIsProcessing(false);
          setStep("success");
          toast({
            title: "Payment Processing",
            description: "Your payment is being verified. Check transactions for updates.",
            variant: "default",
          });
        }
      } catch (err) {
        console.error("Status check error:", err);
      }
    };

    // Initial check
    checkStatus();
    // Then poll every 2 seconds
    intervalId = setInterval(checkStatus, 2000);

    return () => clearInterval(intervalId);
  }, [step, verifyingPaymentId, toast]);

  // --- Render Loading State ---
  if (step === "loading" || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading restaurant details...</p>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-40 glass border-b border-border/30 bg-background/95 backdrop-blur"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="container py-4 flex items-center gap-4">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={() => {
              if (step === "success") {
                navigate("/explore");
              } else if (step === "amount") {
                navigate(-1);
              } else {
                setStep("amount");
              }
            }}
            disabled={step === "processing"}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display font-bold text-foreground line-clamp-1">
              {restaurant.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {restaurant.cuisine} • {restaurant.discount}% Off
            </p>
          </div>
        </div>
      </motion.header>

      <main className="container py-6 max-w-2xl mx-auto">
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
                <p className="text-muted-foreground text-sm mb-3">
                  Enter Your Bill Amount
                </p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-4xl font-display font-bold text-muted-foreground">
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="text-5xl font-display font-bold bg-transparent border-none outline-none w-48 text-center placeholder:text-muted-foreground/20"
                    autoFocus
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
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

              {/* Restaurant Info Card */}
              <Card>
                <CardContent className="p-4 flex gap-4 items-center">
                  <img
                    src={restaurant.image_url || "/placeholder.jpg"}
                    className="w-16 h-16 rounded-md object-cover bg-muted"
                    alt={restaurant.name}
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.jpg";
                    }}
                  />
                  <div>
                    <p className="font-semibold">{restaurant.name}</p>
                    <p className="text-xs text-success flex items-center gap-1 font-medium">
                      <Sparkles className="w-3 h-3" />
                      Save up to ₹{restaurant.max_discount}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Button
                size="lg"
                className="w-full text-lg h-12"
                disabled={amount < 1}
                onClick={() => setStep("breakdown")}
              >
                Continue to Payment
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
              {/* Bill Summary */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bill Amount</span>
                    <span className="font-medium">₹{amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-success">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Restaurant Discount
                    </span>
                    <span className="font-medium">- ₹{restaurantDiscount.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-success">
                      <span className="flex items-center gap-2">
                        <Tag className="w-4 h-4" /> Coupon ({appliedCoupon.code})
                      </span>
                      <span className="font-medium">- ₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-4 flex justify-between items-center font-bold text-lg">
                    <span>Amount to Pay</span>
                    <span className="text-primary">₹{finalAmount.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Coupon Section */}
              {!appliedCoupon ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter Coupon Code"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError("");
                      }}
                      className="uppercase"
                      disabled={couponLoading}
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                    >
                      {couponLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {couponError}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg border border-success/20">
                  <span className="text-sm font-medium text-success flex items-center gap-2">
                    <Check className="w-4 h-4" /> {appliedCoupon.code} applied
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Payment Methods */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Payment Method</h3>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded">
                    <ShieldCheck className="w-3 h-3 text-green-600" /> Secured by
                    Razorpay
                  </span>
                </div>

                <div
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                    displayMethod === "upi"
                      ? "border-primary bg-primary/5"
                      : "border-border/40 hover:border-border"
                  }`}
                  onClick={() => setDisplayMethod("upi")}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">UPI Apps</p>
                      <p className="text-xs text-muted-foreground">
                        Google Pay, PhonePe, Paytm
                      </p>
                    </div>
                  </div>
                  {displayMethod === "upi" && (
                    <div className="w-4 h-4 rounded-full bg-primary" />
                  )}
                </div>

                <div
                  className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                    displayMethod === "card"
                      ? "border-primary bg-primary/5"
                      : "border-border/40 hover:border-border"
                  }`}
                  onClick={() => setDisplayMethod("card")}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="font-medium">Cards & More</p>
                      <p className="text-xs text-muted-foreground">
                        Credit/Debit, Netbanking
                      </p>
                    </div>
                  </div>
                  {displayMethod === "card" && (
                    <div className="w-4 h-4 rounded-full bg-primary" />
                  )}
                </div>
              </div>

              <Button
                size="lg"
                className="w-full text-lg h-12"
                onClick={handlePayment}
                disabled={isProcessing || !isRazorpayLoaded}
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

          {/* STEP 3: PROCESSING */}
          {step === "processing" && (
            <motion.div
              key="processing"
              className="flex flex-col items-center justify-center pt-20 space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <ShieldCheck className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="font-semibold text-lg">Verifying Payment...</h3>
              <p className="text-muted-foreground text-sm text-center max-w-xs">
                Please wait while we confirm your transaction securely
              </p>
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
                <p className="text-muted-foreground text-sm mt-1">
                  Reference: {transactionId}
                </p>
              </div>

              <Card className="bg-secondary/30 border-none">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                  <p className="text-4xl font-bold">₹{finalAmount.toFixed(2)}</p>
                  {totalDiscount > 0 && (
                    <div className="mt-4 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-sm font-medium">
                      <Sparkles className="w-3 h-3" /> You saved ₹
                      {totalDiscount.toFixed(2)}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-gold/10 border border-gold/30">
                <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-white font-bold">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground">
                    +{estimatedRewards} Reward Points Earned
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Available for your next visit
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-12"
                onClick={() => navigate("/explore")}
              >
                Back to Explore
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

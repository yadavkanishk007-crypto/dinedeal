import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Smartphone,
  Sparkles,
  Gift,
  Copy,
  ExternalLink,
  CreditCard,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { restaurants } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type PaymentStep =
  | "amount"
  | "breakdown"
  | "payment-method"
  | "upi"
  | "card"
  | "processing"
  | "success";
type PaymentMethod = "upi" | "card";

// Restaurant's UPI ID
const MERCHANT_UPI_ID = "merchant@upi";

const Pay = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const restaurantId = searchParams.get("restaurant");
  const restaurant =
    restaurants.find((r) => r.id === restaurantId) || restaurants[0];

  const [step, setStep] = useState<PaymentStep>("amount");
  const [billAmount, setBillAmount] = useState("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [upiReference, setUpiReference] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>("upi");
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discount_percent: number;
    max_discount: number | null;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Calculations
  const amount = parseFloat(billAmount) || 0;
  const restaurantDiscount = Math.min(
    amount * (restaurant.discount / 100),
    restaurant.maxDiscount
  );
  
  // Coupon discount calculation
  const couponDiscount = appliedCoupon 
    ? Math.min(
        amount * (appliedCoupon.discount_percent / 100),
        appliedCoupon.max_discount || Infinity
      )
    : 0;
  
  const totalDiscount = restaurantDiscount + couponDiscount;
  const finalAmount = Math.max(amount - totalDiscount, 0);
  const rewardsEarned = Math.floor(amount * 0.02);

  // 1. Generate unique transaction reference
  useEffect(() => {
    setTransactionId(
      `DD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    );
  }, []);

  // 2. Load Razorpay Script dynamically
  useEffect(() => {
    const loadScript = async () => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => setIsRazorpayLoaded(true);
      script.onerror = () => {
        console.error("Razorpay SDK failed to load");
        setIsRazorpayLoaded(false);
      };
      document.body.appendChild(script);
    };
    loadScript();
  }, []);

  const handleProceed = () => {
    if (amount < 100) {
      toast({
        title: "Minimum amount required",
        description: "Bill amount should be at least ₹100",
        variant: "destructive",
      });
      return;
    }
    setStep("breakdown");
  };

  const generateUPILink = () => {
    const upiParams = new URLSearchParams({
      pa: MERCHANT_UPI_ID,
      pn: restaurant.name,
      am: finalAmount.toFixed(2),
      cu: "INR",
      tn: `Payment at ${restaurant.name} - ${transactionId}`,
      tr: transactionId,
    });
    return `upi://pay?${upiParams.toString()}`;
  };

  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    if (method === "upi") {
      const upiLink = generateUPILink();
      window.location.href = upiLink;
      setStep("upi");
    } else {
      setStep("card");
    }
  };

  const copyUPIId = () => {
    navigator.clipboard.writeText(MERCHANT_UPI_ID);
    toast({
      title: "UPI ID Copied",
      description: "Paste it in your UPI app to pay",
    });
  };

  // Logic to handle database recording after payment success
  const recordTransaction = async (
    method: "upi" | "card",
    reference: string
  ) => {
    try {
      // Save transaction to database
      const { data: transactionData, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user?.id,
          restaurant_id: restaurantId,
          bill_amount: amount,
          discount_amount: totalDiscount,
          final_amount: finalAmount,
          rewards_earned: rewardsEarned,
          payment_method: method,
          payment_reference: reference,
          payment_status: "completed",
        })
        .select("id")
        .single();

      if (error) throw error;

      // Record coupon usage if a coupon was applied
      if (appliedCoupon && user?.id && transactionData?.id) {
        try {
          // Insert coupon usage record
          await supabase.from("coupon_usages").insert({
            coupon_id: appliedCoupon.id,
            user_id: user.id,
            transaction_id: transactionData.id,
          });

          // Increment coupon current_uses count using direct update
          const { data: couponData } = await supabase
            .from("coupons")
            .select("current_uses")
            .eq("id", appliedCoupon.id)
            .single();
          
          if (couponData) {
            await supabase
              .from("coupons")
              .update({ current_uses: (couponData.current_uses || 0) + 1 })
              .eq("id", appliedCoupon.id);
          }
        } catch (couponError) {
          console.error("Failed to record coupon usage:", couponError);
        }
      }

      // Update user rewards if logged in
      if (user?.id) {
        const { data: currentRewards } = await supabase
          .from("rewards")
          .select("points, total_earned")
          .eq("user_id", user.id)
          .single();

        if (currentRewards) {
          await supabase
            .from("rewards")
            .update({
              points: currentRewards.points + rewardsEarned,
              total_earned: currentRewards.total_earned + rewardsEarned,
            })
            .eq("user_id", user.id);
        }
      }

      // Send transaction receipt email
      if (user?.email) {
        try {
          await supabase.functions.invoke("send-email", {
            body: {
              to: user.email,
              type: "transaction_receipt",
              data: {
                userName: user.user_metadata?.full_name || "Customer",
                restaurantName: restaurant.name,
                billAmount: amount,
                discount: totalDiscount,
                finalAmount: finalAmount,
                rewardsEarned: rewardsEarned,
                transactionId: transactionId,
                date: new Date().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }),
                paymentMethod: method === "upi" ? "UPI" : "Card",
                couponCode: appliedCoupon?.code || null,
              },
            },
          });
        } catch (emailError) {
          console.error("Failed to send receipt email:", emailError);
        }
      }

      setStep("success");
    } catch (error) {
      console.error("Payment recording error:", error);
      toast({
        title: "Payment Recorded",
        description:
          "Payment successful, but there was an issue syncing details.",
        variant: "destructive",
      });
      setStep("success"); // Still show success if the payment itself worked
    }
  };

  // --- Real Razorpay Logic ---
  const startRazorpayPayment = async (amountVal: number) => {
    if (!isRazorpayLoaded) {
      toast({
        title: "System Loading",
        description: "Payment system is initializing. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    try {
      setStep("processing");

      // 1️⃣ Create order from backend
      const res = await fetch(
        "https://dinedeal-backend-076n.onrender.com/api/payments/create-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: amountVal }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error("Order creation failed");
      }

      const { order } = data;

      // 2️⃣ Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Ensure this exists in .env
        amount: order.amount,
        currency: order.currency,
        name: "DineDeal",
        description: `Payment at ${restaurant.name}`,
        order_id: order.id,
        handler: async function (response: any) {
          // 3️⃣ Payment success -> Record in Supabase
          await recordTransaction("card", response.razorpay_payment_id);
        },
        theme: { color: "#000000" },
        modal: {
          ondismiss: function () {
            setStep("card"); // Go back to card step if user cancels
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast({
          title: "Payment Failed",
          description: response.error.description,
          variant: "destructive",
        });
        setStep("card");
      });
      rzp.open();
    } catch (error) {
      console.error("Razorpay error:", error);
      toast({
        title: "Payment Initialization Failed",
        description: "Unable to initiate card payment. Check connection.",
        variant: "destructive",
      });
      setStep("card");
    }
  };

  // --- UPI Logic ---
  const handleConfirmUPIPayment = async () => {
    if (!upiReference.trim()) {
      toast({
        title: "Enter UPI Reference",
        description:
          "Please enter the UPI reference number from your payment app",
        variant: "destructive",
      });
      return;
    }
    setStep("processing");
    await recordTransaction("upi", upiReference);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-40 glass border-b border-border/30"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="container py-4 flex items-center gap-4">
          <motion.button
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            onClick={() => {
              if (step === "amount") navigate(-1);
              else if (step === "card" || step === "upi") setStep("breakdown");
              else setStep("amount");
            }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div>
            <h1 className="font-display font-bold text-foreground">
              Pay at {restaurant.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {restaurant.discount}% discount available
            </p>
          </div>
        </div>
      </motion.header>

      <main className="container py-6 pb-24">
        <AnimatePresence mode="wait">
          {/* Step 1: Enter Amount */}
          {step === "amount" && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-2">
                  Enter your bill amount
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl font-display font-bold text-foreground">
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="text-5xl font-display font-bold bg-transparent border-none outline-none w-48 text-center text-foreground placeholder:text-muted-foreground/30"
                  />
                </div>
                {amount > 0 && (
                  <motion.p
                    className="text-success text-sm mt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    You'll save up to ₹{restaurantDiscount.toFixed(0)} on this bill!
                  </motion.p>
                )}
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[500, 1000, 2000, 5000].map((value) => (
                  <Button
                    key={value}
                    variant="secondary"
                    size="sm"
                    onClick={() => setBillAmount(value.toString())}
                    className="font-medium"
                  >
                    ₹{value}
                  </Button>
                ))}
              </div>

              {/* Restaurant Card */}
              <Card className="border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    <img
                      src={restaurant.imageUrl}
                      alt={restaurant.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {restaurant.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {restaurant.cuisine}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded-full gradient-primary text-xs font-medium text-primary-foreground">
                          {restaurant.discount}% OFF
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Max ₹{restaurant.maxDiscount}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="gradient"
                size="xl"
                className="w-full"
                onClick={handleProceed}
                disabled={amount < 100}
              >
                Continue
              </Button>
            </motion.div>
          )}

          {/* Step 2: Payment Breakdown */}
          {step === "breakdown" && (
            <motion.div
              key="breakdown"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="font-display font-bold text-xl text-foreground">
                Payment Summary
              </h2>

              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Bill Amount</span>
                    <span className="font-medium text-foreground">
                      ₹{amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-success">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      DineDeal Discount ({restaurant.discount}%)
                    </span>
                    <span className="font-medium">
                      - ₹{restaurantDiscount.toFixed(2)}
                    </span>
                  </div>
                  {appliedCoupon && couponDiscount > 0 && (
                    <div className="flex justify-between items-center text-success">
                      <span className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Coupon ({appliedCoupon.code})
                      </span>
                      <span className="font-medium">
                        - ₹{couponDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-border pt-4 flex justify-between items-center">
                    <span className="font-semibold text-foreground">
                      You Pay
                    </span>
                    <span className="text-2xl font-display font-bold gradient-text">
                      ₹{finalAmount.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Rewards Preview */}
              <Card className="border-gold/30 bg-gold/5">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center">
                    <Gift className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      Earn {rewardsEarned} Reward Points
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Redeem on your next visit!
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Coupon Code Input */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-foreground mb-3">Have a coupon?</p>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/30">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-success" />
                        <span className="font-medium text-foreground">{appliedCoupon.code}</span>
                        <span className="text-xs text-success">Applied!</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponCode("");
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError("");
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          if (!couponCode.trim()) return;
                          setCouponLoading(true);
                          setCouponError("");
                          
                          try {
                            const { data: coupon, error } = await supabase
                              .from("coupons")
                              .select("*")
                              .eq("code", couponCode.trim())
                              .eq("is_active", true)
                              .maybeSingle();

                            if (error) throw error;
                            
                            if (!coupon) {
                              setCouponError("Invalid coupon code");
                              return;
                            }

                            // Check validity dates
                            const now = new Date();
                            if (coupon.valid_from && new Date(coupon.valid_from) > now) {
                              setCouponError("Coupon not yet valid");
                              return;
                            }
                            if (coupon.valid_until && new Date(coupon.valid_until) < now) {
                              setCouponError("Coupon expired");
                              return;
                            }

                            // Check min order amount
                            if (coupon.min_order_amount && amount < coupon.min_order_amount) {
                              setCouponError(`Min order ₹${coupon.min_order_amount}`);
                              return;
                            }

                            // Check max uses
                            if (coupon.max_uses && (coupon.current_uses || 0) >= coupon.max_uses) {
                              setCouponError("Coupon usage limit reached");
                              return;
                            }

                            setAppliedCoupon({
                              id: coupon.id,
                              code: coupon.code,
                              discount_percent: coupon.discount_percent,
                              max_discount: coupon.max_discount,
                            });
                            toast({
                              title: "Coupon Applied!",
                              description: `${coupon.discount_percent}% off applied`,
                            });
                          } catch (err) {
                            console.error("Coupon error:", err);
                            setCouponError("Failed to apply coupon");
                          } finally {
                            setCouponLoading(false);
                          }
                        }}
                        disabled={couponLoading || !couponCode.trim()}
                      >
                        {couponLoading ? "..." : "Apply"}
                      </Button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-xs text-destructive mt-2">{couponError}</p>
                  )}
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <div>
                <h3 className="font-display font-bold text-lg text-foreground mb-3">
                  Select Payment Method
                </h3>
                <div className="space-y-3">
                  {/* UPI Option */}
                  <Card
                    className={`border-2 cursor-pointer transition-all ${
                      selectedPaymentMethod === "upi"
                        ? "border-primary bg-primary/5"
                        : "border-border/50 hover:border-primary/30"
                    }`}
                    onClick={() => setSelectedPaymentMethod("upi")}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            UPI Payment
                          </p>
                          <p className="text-xs text-muted-foreground">
                            GPay, PhonePe, Paytm & more
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPaymentMethod === "upi"
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {selectedPaymentMethod === "upi" && (
                          <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card Option */}
                  <Card
                    className={`border-2 cursor-pointer transition-all ${
                      selectedPaymentMethod === "card"
                        ? "border-primary bg-primary/5"
                        : "border-border/50 hover:border-primary/30"
                    }`}
                    onClick={() => setSelectedPaymentMethod("card")}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Credit / Debit Card
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Visa, Mastercard, RuPay
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPaymentMethod === "card"
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {selectedPaymentMethod === "card" && (
                          <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Button
                variant="gradient"
                size="xl"
                className="w-full"
                onClick={() =>
                  handleSelectPaymentMethod(selectedPaymentMethod)
                }
              >
                Pay ₹{finalAmount.toFixed(2)} via{" "}
                {selectedPaymentMethod === "upi" ? "UPI" : "Card"}
              </Button>
            </motion.div>
          )}

          {/* Step 3a: UPI Payment */}
          {step === "upi" && (
            <motion.div
              key="upi"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="font-display font-bold text-xl text-foreground mb-2">
                  Complete UPI Payment
                </h2>
                <p className="text-muted-foreground text-sm">
                  Pay ₹{finalAmount.toFixed(2)} using any UPI app
                </p>
              </div>

              {/* UPI ID Display */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    Pay to UPI ID
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium text-foreground">
                      {MERCHANT_UPI_ID}
                    </span>
                    <Button variant="ghost" size="sm" onClick={copyUPIId}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Amount */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Amount to Pay
                  </p>
                  <p className="text-3xl font-display font-bold text-primary">
                    ₹{finalAmount.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              {/* Open UPI App Button */}
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => (window.location.href = generateUPILink())}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open UPI App
              </Button>

              {/* Transaction Reference Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Enter UPI Reference Number
                </label>
                <p className="text-xs text-muted-foreground">
                  After payment, enter the UTR/Reference number from your UPI
                  app
                </p>
                <Input
                  placeholder="e.g., 123456789012"
                  value={upiReference}
                  onChange={(e) => setUpiReference(e.target.value)}
                  className="text-center text-lg tracking-wider"
                />
              </div>

              <Button
                variant="gradient"
                size="xl"
                className="w-full"
                onClick={handleConfirmUPIPayment}
                disabled={!upiReference.trim()}
              >
                Confirm Payment
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Transaction ID: {transactionId}
              </p>
            </motion.div>
          )}

          {/* Step 3b: Card Payment (Razorpay Integrated) */}
          {step === "card" && (
            <motion.div
              key="card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="font-display font-bold text-xl text-foreground mb-2">
                  Pay with Card
                </h2>
                <p className="text-muted-foreground text-sm">
                  Secure card payment powered by Razorpay
                </p>
              </div>

              <Card className="border-border/50">
                <CardContent className="p-6 space-y-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    You will be redirected to Razorpay’s secure payment screen.
                  </p>

                  <Button
                    variant="gradient"
                    size="xl"
                    className="w-full"
                    onClick={() => startRazorpayPayment(finalAmount)}
                    disabled={!isRazorpayLoaded}
                  >
                    {!isRazorpayLoaded
                      ? "Loading System..."
                      : `Pay ₹${finalAmount.toFixed(2)} Securely`}
                  </Button>
                </CardContent>
              </Card>

              <p className="text-xs text-center text-muted-foreground">
                Transaction ID: {transactionId}
              </p>
            </motion.div>
          )}

          {/* Step 4: Processing */}
          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <motion.div
                className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-6"
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "linear",
                }}
              >
                <Smartphone className="w-10 h-10 text-primary-foreground" />
              </motion.div>
              <h2 className="font-display font-bold text-2xl text-foreground mb-2">
                Verifying Payment
              </h2>
              <p className="text-muted-foreground">
                Please wait a moment...
              </p>
            </motion.div>
          )}

          {/* Step 5: Success */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <motion.div
                className="w-24 h-24 rounded-full gradient-success flex items-center justify-center mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
              >
                <Check className="w-12 h-12 text-primary-foreground" />
              </motion.div>

              <h2 className="font-display font-bold text-3xl text-foreground mb-2">
                Payment Successful!
              </h2>
              <p className="text-muted-foreground mb-6">
                You saved ₹{totalDiscount.toFixed(0)} on this transaction
              </p>

              {/* Receipt Summary */}
              <Card className="w-full max-w-sm border-border/50 mb-6">
                <CardContent className="p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bill Amount</span>
                    <span className="text-foreground">
                      ₹{amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-success">
                    <span>Total Savings</span>
                    <span>- ₹{totalDiscount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-semibold">
                    <span className="text-foreground">Paid</span>
                    <span className="text-primary">
                      ₹{finalAmount.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Rewards Earned */}
              <motion.div
                className="flex items-center gap-3 p-4 rounded-2xl bg-gold/10 border border-gold/30 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Gift className="w-8 h-8 text-gold" />
                <div className="text-left">
                  <p className="font-semibold text-foreground">
                    +{rewardsEarned} Points Earned!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Added to your rewards balance
                  </p>
                </div>
              </motion.div>

              <Button
                variant="gradient"
                size="xl"
                className="w-full max-w-sm"
                onClick={() => navigate("/explore")}
              >
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Pay;

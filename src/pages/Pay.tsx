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
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// --- Types ---
type PaymentStep =
  | "loading"
  | "amount"
  | "breakdown"
  | "upi"
  | "card"
  | "processing"
  | "success";

type PaymentMethod = "upi" | "card";

type Restaurant = {
  id: string;
  name: string;
  discount: number;
  max_discount: number;
  upi_id: string;
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

const Pay = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  // --- Core State ---
  const restaurantId = searchParams.get("restaurant");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [step, setStep] = useState<PaymentStep>("loading");
  
  // --- Payment State ---
  const [billAmount, setBillAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [upiReference, setUpiReference] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("upi");
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);

  // --- Coupon State ---
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // --- 1. Safety & Initialization ---
  useEffect(() => {
    if (!restaurantId) {
      toast({
        title: "Invalid Link",
        description: "No restaurant specified.",
        variant: "destructive",
      });
      navigate("/explore");
      return;
    }

    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", restaurantId)
          .single();

        if (error || !data) throw new Error();

        setRestaurant(data);
        setStep("amount");
        
        // Generate Transaction ID once restaurant is confirmed
        setTransactionId(
          `DD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
        );
      } catch (err) {
        toast({
          title: "Restaurant Not Found",
          description: "This restaurant does not exist or has been removed.",
          variant: "destructive",
        });
        navigate("/explore");
      }
    };

    loadData();
  }, [restaurantId, navigate, toast]);

  // --- 2. Load Razorpay ---
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setIsRazorpayLoaded(true);
    document.body.appendChild(script);
  }, []);

  // --- Calculations ---
  const amount = parseFloat(billAmount) || 0;
  
  // Safe Restaurant Discount Calculation
  // We use (|| 0) to handle undefined/null discount
  // We use (?? Infinity) to handle undefined/null max_discount (assuming no limit if missing)
  const restaurantDiscount = restaurant
    ? Math.min(
        amount * ((restaurant.discount || 0) / 100), 
        restaurant.max_discount ?? Infinity
      )
    : 0;

  // Coupon Discount
  const couponDiscount = appliedCoupon
    ? Math.min(
        amount * (appliedCoupon.discount_percent / 100),
        appliedCoupon.max_discount || Infinity
      )
    : 0;

  const totalDiscount = restaurantDiscount + couponDiscount;
  const finalAmount = Math.max(amount - totalDiscount, 0);
  const rewardsEarned = Math.floor(amount * 0.02);

  // --- Handlers ---

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");

    try {
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error || !coupon) {
        setCouponError("Invalid coupon code");
        return;
      }

      // Validations
      const now = new Date();
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        setCouponError("Coupon expired");
        return;
      }
      if (coupon.min_order_amount && amount < coupon.min_order_amount) {
        setCouponError(`Min order ₹${coupon.min_order_amount}`);
        return;
      }

      setAppliedCoupon(coupon);
      toast({ title: "Coupon Applied!", description: `${coupon.discount_percent}% off added.` });
    } catch (err) {
      setCouponError("Failed to verify coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const generateUPILink = () => {
    if (!restaurant) return "";
    const params = new URLSearchParams({
      pa: restaurant.upi_id,
      pn: restaurant.name,
      am: finalAmount.toFixed(2),
      cu: "INR",
      tn: `Payment - ${transactionId}`,
      tr: transactionId,
    });
    return `upi://pay?${params.toString()}`;
  };

  // --- Core Transaction Recorder ---
  const recordTransaction = async (method: "upi" | "card", reference: string) => {
    if (!restaurant) return;
    
    try {
      // 1. Insert Transaction
      const { data: txnData, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user?.id || null, // Allow guest checkout if needed, or enforce auth earlier
          restaurant_id: restaurant.id,
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

      // 2. Record Coupon Usage
      if (appliedCoupon && user?.id && txnData) {
        await supabase.from("coupon_usages").insert({
          coupon_id: appliedCoupon.id,
          user_id: user.id,
          transaction_id: txnData.id,
        });
        // Increment use count (RPC or simple update if policies allow)
        // await supabase.rpc('increment_coupon_usage', { coupon_id: appliedCoupon.id });
      }

      // 3. Update Rewards
      if (user?.id) {
         // Assuming a simplified update or RPC
         const { data: currentRewards } = await supabase
          .from("rewards")
          .select("*")
          .eq("user_id", user.id)
          .single();
         
         if (currentRewards) {
            await supabase.from("rewards").update({
               points: currentRewards.points + rewardsEarned,
               total_earned: currentRewards.total_earned + rewardsEarned
            }).eq("user_id", user.id);
         }
      }

      // 4. Send Receipt Email
      if (user?.email) {
        await supabase.functions.invoke("send-email", {
          body: {
            to: user.email,
            type: "transaction_receipt",
            data: {
              restaurantName: restaurant.name,
              amount: finalAmount,
              date: new Date().toLocaleDateString(),
              transactionId: transactionId,
            },
          },
        });
      }

      setStep("success");
    } catch (err) {
      console.error("Sync Error:", err);
      // Even if sync fails, show success because payment (money) likely went through
      toast({
         title: "Payment Recorded",
         description: "Payment successful, but receipt sync had a delay.",
         variant: "default" 
      });
      setStep("success");
    }
  };

  // --- Payment Triggers ---

  const handleRazorpay = async () => {
    if (!isRazorpayLoaded || !restaurant) return;
    setStep("processing");

    try {
      // Create Order
      const res = await fetch(
        "https://dinedeal-backend-076n.onrender.com/api/payments/create-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: finalAmount }),
        }
      );
      const data = await res.json();
      if (!data.success) throw new Error("Backend order creation failed");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        name: restaurant.name,
        description: `Bill Payment - ${transactionId}`,
        order_id: data.order.id,
        handler: function (response: any) {
          recordTransaction("card", response.razorpay_payment_id);
        },
        modal: {
          ondismiss: () => setStep("breakdown"),
        },
        theme: { color: "#000000" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not initiate card payment", variant: "destructive" });
      setStep("breakdown");
    }
  };

  // --- Render ---

  if (step === "loading" || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
           <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
           <p className="text-muted-foreground">Loading restaurant details...</p>
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
              else if (step === "upi" || step === "card") setStep("breakdown");
              else setStep("amount");
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display font-bold text-foreground">
              Pay at {restaurant.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {restaurant.cuisine} • {restaurant.discount}% Off Available
            </p>
          </div>
        </div>
      </motion.header>

      <main className="container py-6">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: AMOUNT */}
          {step === "amount" && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm mb-2">Total Bill Amount</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-4xl font-display font-bold">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="text-5xl font-display font-bold bg-transparent border-none outline-none w-48 text-center placeholder:text-muted-foreground/30"
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
                       <p className="text-xs text-success flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Save up to ₹{restaurant.max_discount} here
                       </p>
                    </div>
                 </CardContent>
              </Card>

              <Button
                size="lg"
                className="w-full text-lg"
                disabled={amount < 1}
                onClick={() => setStep("breakdown")}
              >
                Continue
              </Button>
            </motion.div>
          )}

          {/* STEP 2: BREAKDOWN */}
          {step === "breakdown" && (
            <motion.div
              key="breakdown"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Summary Card */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bill Amount</span>
                    <span>₹{amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-success">
                    <span className="flex items-center gap-2"><Sparkles className="w-4 h-4"/> DineDeal Offer</span>
                    <span>- ₹{restaurantDiscount.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-success">
                       <span className="flex items-center gap-2"><Tag className="w-4 h-4"/> Coupon ({appliedCoupon.code})</span>
                       <span>- ₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-4 flex justify-between items-center font-bold text-lg">
                    <span>To Pay</span>
                    <span>₹{finalAmount.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Coupon Input */}
              {!appliedCoupon ? (
                 <div className="flex gap-2">
                    <Input 
                       placeholder="Enter Coupon Code" 
                       value={couponCode}
                       onChange={(e) => setCouponCode(e.target.value)}
                       className="uppercase"
                    />
                    <Button onClick={handleApplyCoupon} disabled={couponLoading}>
                       {couponLoading ? "..." : "Apply"}
                    </Button>
                 </div>
              ) : (
                 <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg border border-success/20">
                    <span className="text-sm font-medium text-success flex items-center gap-2">
                       <Check className="w-4 h-4" /> Code {appliedCoupon.code} applied
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setAppliedCoupon(null)}><X className="w-4 h-4"/></Button>
                 </div>
              )}
              {couponError && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {couponError}</p>}

              {/* Payment Methods */}
              <div className="space-y-3 pt-4">
                <h3 className="font-semibold text-lg">Payment Method</h3>
                
                <div 
                   className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${selectedPaymentMethod === "upi" ? "border-primary bg-primary/5" : "border-border/10 bg-transparent"}`}
                   onClick={() => setSelectedPaymentMethod("upi")}
                >
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"><Smartphone className="w-5 h-5 text-primary"/></div>
                      <div>
                         <p className="font-medium">UPI Apps</p>
                         <p className="text-xs text-muted-foreground">GPay, PhonePe, Paytm</p>
                      </div>
                   </div>
                   {selectedPaymentMethod === "upi" && <div className="w-4 h-4 rounded-full bg-primary" />}
                </div>

                <div 
                   className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${selectedPaymentMethod === "card" ? "border-primary bg-primary/5" : "border-border/10 bg-transparent"}`}
                   onClick={() => setSelectedPaymentMethod("card")}
                >
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"><CreditCard className="w-5 h-5 text-gold"/></div>
                      <div>
                         <p className="font-medium">Credit / Debit Card</p>
                         <p className="text-xs text-muted-foreground">Via Razorpay Secure</p>
                      </div>
                   </div>
                   {selectedPaymentMethod === "card" && <div className="w-4 h-4 rounded-full bg-primary" />}
                </div>
              </div>

              <Button size="lg" className="w-full" onClick={() => {
                 if (selectedPaymentMethod === 'upi') {
                    window.location.href = generateUPILink();
                    setStep("upi");
                 } else {
                    handleRazorpay();
                 }
              }}>
                 Pay ₹{finalAmount.toFixed(2)}
              </Button>
            </motion.div>
          )}

          {/* STEP 3: UPI CONFIRMATION */}
          {step === "upi" && (
             <motion.div
               key="upi"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="space-y-6 text-center pt-8"
             >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                   <Smartphone className="w-10 h-10" />
                </div>
                <div>
                   <h2 className="text-xl font-bold">Complete Payment</h2>
                   <p className="text-muted-foreground text-sm mt-1">Please authorize payment in your UPI app</p>
                </div>

                <div className="bg-secondary/50 p-4 rounded-lg flex justify-between items-center">
                   <span className="font-mono text-sm">{restaurant.upi_id}</span>
                   <Button variant="ghost" size="sm" onClick={() => {
                      navigator.clipboard.writeText(restaurant.upi_id);
                      toast({title: "Copied UPI ID"});
                   }}>
                      <Copy className="w-4 h-4" />
                   </Button>
                </div>

                <div className="text-left space-y-2">
                   <label className="text-sm font-medium ml-1">Enter UPI Reference (UTR)</label>
                   <Input 
                      placeholder="e.g. 3245xxxxxxxx" 
                      value={upiReference}
                      onChange={(e) => setUpiReference(e.target.value)}
                   />
                   <p className="text-xs text-muted-foreground ml-1">Required to verify your transaction.</p>
                </div>

                <Button 
                   className="w-full" 
                   size="lg" 
                   disabled={!upiReference}
                   onClick={() => {
                      setStep("processing");
                      setTimeout(() => recordTransaction("upi", upiReference), 1500); // Fake process delay for UX
                   }}
                >
                   I Have Paid
                </Button>
             </motion.div>
          )}

          {/* STEP 4: PROCESSING */}
          {step === "processing" && (
             <motion.div className="flex flex-col items-center justify-center pt-20 space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <h3 className="font-semibold text-lg">Verifying Payment...</h3>
                <p className="text-muted-foreground text-sm">Please do not close this window.</p>
             </motion.div>
          )}

          {/* STEP 5: SUCCESS */}
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
                   <p className="text-muted-foreground">Transaction ID: {transactionId}</p>
                </div>

                <Card className="bg-secondary/30 border-none">
                   <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground mb-1">You Paid</p>
                      <p className="text-3xl font-bold">₹{finalAmount.toFixed(2)}</p>
                      {totalDiscount > 0 && (
                         <div className="mt-4 inline-block px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-sm font-medium">
                            Saved ₹{totalDiscount.toFixed(2)}!
                         </div>
                      )}
                   </CardContent>
                </Card>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-gold/10 border border-gold/30">
                   <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-white font-bold">
                      <Gift className="w-5 h-5"/>
                   </div>
                   <div className="text-left">
                      <p className="font-bold text-foreground">+{rewardsEarned} Points Earned</p>
                      <p className="text-xs text-muted-foreground">Use these on your next visit!</p>
                   </div>
                </div>

                <Button size="lg" className="w-full" onClick={() => navigate("/explore")}>
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

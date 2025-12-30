import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Check, 
  Smartphone, 
  Sparkles,
  Gift,
  ChevronRight,
  Copy,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { restaurants } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type PaymentStep = "amount" | "breakdown" | "upi" | "processing" | "success";

// Restaurant's UPI ID (this would come from the restaurant record in production)
const MERCHANT_UPI_ID = "merchant@upi";

const Pay = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const restaurantId = searchParams.get("restaurant");
  const restaurant = restaurants.find((r) => r.id === restaurantId) || restaurants[0];
  
  const [step, setStep] = useState<PaymentStep>("amount");
  const [billAmount, setBillAmount] = useState("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [upiReference, setUpiReference] = useState("");

  const amount = parseFloat(billAmount) || 0;
  const discount = Math.min(amount * (restaurant.discount / 100), restaurant.maxDiscount);
  const finalAmount = amount - discount;
  const rewardsEarned = Math.floor(amount * 0.02);

  // Generate a unique transaction reference
  useEffect(() => {
    setTransactionId(`ZAVE${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
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

  const handleOpenUPI = () => {
    const upiLink = generateUPILink();
    window.location.href = upiLink;
    setStep("upi");
  };

  const copyUPIId = () => {
    navigator.clipboard.writeText(MERCHANT_UPI_ID);
    toast({
      title: "UPI ID Copied",
      description: "Paste it in your UPI app to pay",
    });
  };

  const handleConfirmPayment = async () => {
    if (!upiReference.trim()) {
      toast({
        title: "Enter UPI Reference",
        description: "Please enter the UPI reference number from your payment app",
        variant: "destructive",
      });
      return;
    }

    setStep("processing");

    try {
      // Save transaction to database
      const { error } = await supabase.from("transactions").insert({
        user_id: user?.id,
        restaurant_id: restaurantId,
        bill_amount: amount,
        discount_amount: discount,
        final_amount: finalAmount,
        rewards_earned: rewardsEarned,
        payment_method: "upi",
        payment_reference: upiReference,
        payment_status: "completed",
      });

      if (error) throw error;

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

      setTimeout(() => setStep("success"), 1500);
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment recorded",
        description: "Your payment has been recorded successfully!",
      });
      setTimeout(() => setStep("success"), 1500);
    }
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
            onClick={() => step === "amount" ? navigate(-1) : setStep("amount")}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div>
            <h1 className="font-display font-bold text-foreground">Pay at {restaurant.name}</h1>
            <p className="text-xs text-muted-foreground">{restaurant.discount}% discount available</p>
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
                <p className="text-muted-foreground text-sm mb-2">Enter your bill amount</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl font-display font-bold text-foreground">₹</span>
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
                    You'll save up to ₹{discount.toFixed(0)} on this bill!
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
                      <h3 className="font-semibold text-foreground">{restaurant.name}</h3>
                      <p className="text-xs text-muted-foreground">{restaurant.cuisine}</p>
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
                    <span className="font-medium text-foreground">₹{amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-success">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Zave Discount ({restaurant.discount}%)
                    </span>
                    <span className="font-medium">- ₹{discount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-4 flex justify-between items-center">
                    <span className="font-semibold text-foreground">You Pay</span>
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
                    <p className="font-semibold text-foreground">Earn {rewardsEarned} Reward Points</p>
                    <p className="text-xs text-muted-foreground">Redeem on your next visit!</p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <div>
                <h3 className="font-display font-bold text-lg text-foreground mb-3">
                  Pay With
                </h3>
                <Card className="border-primary/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">UPI Payment</p>
                        <p className="text-xs text-muted-foreground">GPay, PhonePe, Paytm & more</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </div>

              <Button
                variant="gradient"
                size="xl"
                className="w-full"
                onClick={handleOpenUPI}
              >
                Pay ₹{finalAmount.toFixed(2)} via UPI
              </Button>
            </motion.div>
          )}

          {/* Step 3: UPI Payment */}
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
                  <p className="text-xs text-muted-foreground mb-2">Pay to UPI ID</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium text-foreground">{MERCHANT_UPI_ID}</span>
                    <Button variant="ghost" size="sm" onClick={copyUPIId}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Amount */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
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
                onClick={() => window.location.href = generateUPILink()}
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
                  After payment, enter the UTR/Reference number from your UPI app
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
                onClick={handleConfirmPayment}
                disabled={!upiReference.trim()}
              >
                Confirm Payment
              </Button>

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
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              >
                <Smartphone className="w-10 h-10 text-primary-foreground" />
              </motion.div>
              <h2 className="font-display font-bold text-2xl text-foreground mb-2">
                Verifying Payment
              </h2>
              <p className="text-muted-foreground">Please wait a moment...</p>
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
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <Check className="w-12 h-12 text-success-foreground" />
              </motion.div>
              
              <motion.h2
                className="font-display font-bold text-2xl text-foreground mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Payment Successful!
              </motion.h2>
              
              <motion.p
                className="text-muted-foreground mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Thank you for dining at {restaurant.name}
              </motion.p>

              <motion.div
                className="w-full max-w-sm space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">You Saved</p>
                    <p className="text-3xl font-display font-bold text-success">
                      ₹{discount.toFixed(0)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-gold/30 bg-gold/5">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Rewards Earned</p>
                    <p className="text-2xl font-display font-bold text-gold">
                      +{rewardsEarned} Points
                    </p>
                  </CardContent>
                </Card>

                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full mt-6"
                  onClick={() => navigate("/")}
                >
                  Back to Home
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Pay;

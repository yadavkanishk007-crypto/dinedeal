import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  Clock,
  CheckCircle2,
  UtensilsCrossed,
  CreditCard,
  Download,
  Tag,
  Wallet,
  Info,
  X,
  AlertCircle,
  Check,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { Input } from "@/components/ui/input";

// 1️⃣ REMOVED: loadRazorpay and createRazorpayOptions imports

/* =========================
   TYPES (SHALLOW & SAFE)
========================= */

interface RestaurantInfo {
  name: string;
  address: string;
  image_url: string | null;
}

interface DineInSession {
  id: string;
  restaurant_id: string;
  customer_id: string;
  status: "open" | "bill_posted" | "paid";
  created_at: string;
  restaurants: RestaurantInfo;
}

interface Transaction {
  id: string;
  dinein_session_id: string | null;
  bill_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_status: "pending" | "completed" | "failed";
  payment_reference: string | null;
  pos_bill_no: string | null;
  offer_id: string | null;
  // Let the backend know we may have updated the final amount
}

type Coupon = {
  id: string;
  code: string;
  discount_percent: number;
  max_discount: number | null;
  min_order_amount: number | null;
  valid_until: string | null;
};

/* =========================
   COMPONENT
========================= */

const DineIn = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const restaurantId = searchParams.get("restaurant");

  const [session, setSession] = useState<DineInSession | null>(null);
  const [bill, setBill] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  // Cashback State
  const [availablePoints, setAvailablePoints] = useState(0);
  const [redeemableAmount, setRedeemableAmount] = useState(0);
  const [useCashback, setUseCashback] = useState(false);
  const [pointsToRedeemInput, setPointsToRedeemInput] = useState("");
  const [showClarification, setShowClarification] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  /* =========================
      AUTH + SESSION INIT
  ========================= */

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/dine-in?restaurant=${restaurantId ?? ""}`);
      return;
    }

    if (user && restaurantId && !session) {
      initializeSession();
    }
  }, [authLoading, user, restaurantId]);

  const initializeSession = async () => {
    if (!user?.id || !restaurantId) {
      setLoading(false);
      return;
    }

    try {
      const query = (supabase as any)
        .from("dinein_sessions")
        .select(`
          id,
          restaurant_id,
          customer_id,
          status,
          created_at,
          restaurants (
            name,
            address,
            image_url
          )
        `)
        .eq("restaurant_id", restaurantId)
        .eq("is_expired", false)
        .in("status", ["open", "bill_posted", "paid"])
        .eq("customer_id", user.id)        
        .order("created_at", { ascending: false })
        .limit(1)
      const { data, error } = await query.maybeSingle();
      const existing = data as DineInSession | null;
      if (error) throw error;

      if (existing) {
        setSession(existing as DineInSession);
        if (existing.status === "bill_posted") {
          fetchBill(existing.id);
        }
        setLoading(false);
      } else {
        const { data: created, error: createError } = await supabase
          .from("dinein_sessions")
          .insert({
            restaurant_id: restaurantId,
            customer_id: user.id,
            status: "open",
          })
          .select(`
            id,
            restaurant_id,
            customer_id,
            status,
            created_at,
            restaurants (
              name,
              address,
              image_url
            )
          `)
          .single();

        if (createError) throw createError;

        setSession(created as DineInSession);
        toast.success("Dine-in session started!");
        setLoading(false);
      }
    } catch (error: any) {
      console.error("DINEIN_CREATE_FAILED", {
        message: error?.message,
        details: error,
      });
      toast.error(error?.message || "Failed to start dine-in session");
      setLoading(false);
    }
  };

  const fetchPoints = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("rewards")
      .select("points")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setAvailablePoints(data.points || 0);
      setRedeemableAmount(Math.floor((data.points || 0) / 10));
    }
  };

  /* =========================
      BILL FETCH + REALTIME
  ========================= */

  useEffect(() => {
    if (!session) return;

    fetchBill(session.id);
    fetchPoints();

    // Keep realtime subscription: This will update the UI when payment is completed via webhook
    const channel = supabase
      .channel(`txn-updates-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `dinein_session_id=eq.${session.id}`,
        },
        () => fetchBill(session.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  const fetchBill = async (sessionId: string) => {
    const { data } = await supabase
      .from("transactions")
      .select(`
        id,
        dinein_session_id,
        bill_amount,
        discount_amount,
        final_amount,
        payment_status,
        payment_reference,
        pos_bill_no,
        offer_id
      `)
      .eq("dinein_session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setBill(data as Transaction);
    }
  };

  /* =========================
      COUPONS & CALCS
  ========================= */

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!bill || !restaurantId) return;
    
    setCouponLoading(true);
    setCouponError("");

    try {
      const now = new Date().toISOString();
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase().trim())
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true)
        .or(`valid_until.gte.${now},valid_until.is.null`)
        .maybeSingle();

      if (error) throw error;
      if (!coupon) throw new Error("Invalid or expired coupon code");

      // Check min order amount against the RESTAURANT POSTED final amount
      if (coupon.min_order_amount && bill.final_amount < coupon.min_order_amount) {
        throw new Error(`Minimum order of ₹${coupon.min_order_amount} required`);
      }

      setAppliedCoupon(coupon as Coupon);
      setCouponError("");
      toast.success("Coupon applied successfully!");
    } catch (err: any) {
      setCouponError(err.message);
      toast.error(err.message);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Base is the final amount posted by the restaurant POS
  const baseAmount = bill?.final_amount || 0;

  const couponDiscount = appliedCoupon
    ? Math.min(
      baseAmount * (appliedCoupon.discount_percent / 100),
      appliedCoupon.max_discount || Infinity
    )
    : 0;

  const amountAfterPrevDiscounts = baseAmount - couponDiscount;
  
  // Custom points usage logic
  const parsedPointsInput = parseInt(pointsToRedeemInput) || 0;
  // Ensure we don't use more points than available, and not more than the pill permits
  const actualPointsToUse = Math.min(
    parsedPointsInput, 
    availablePoints, 
    Math.floor(amountAfterPrevDiscounts * 10) // Max points that can be covered by the bill
  );

  const cashbackDiscount = useCashback && baseAmount >= 1000 
    ? actualPointsToUse / 10
    : 0;
  
  const pointsUsed = useCashback ? actualPointsToUse : 0;

  const totalAddedDiscount = couponDiscount + cashbackDiscount;
  const newFinalAmount = Math.max(baseAmount - totalAddedDiscount, 0);

  /* =========================
      PAYMENT (UPDATED)
  ========================= */

  // 2️⃣ PAY BUTTON HANDLER (REPLACED)
  const handlePayment = async () => {
    if (!bill || !session || !user || paying) return;
  
    try {
      setPaying(true);
  
      // 1️⃣ Ask backend to create Razorpay order
      const res = await fetch(
        "https://dinedeal-backend-076n.onrender.com/api/payments/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: newFinalAmount,
            transactionId: bill.id,
            dineinSessionId: session.id,
            restaurantId: session.restaurant_id,
            pointsUsed: pointsUsed, 
            discountAmount: totalAddedDiscount, 
            cashbackApplied: cashbackDiscount,
            restaurantBill: baseAmount - couponDiscount,
            couponCode: appliedCoupon?.code,
            type: "dine_in",
            userId: user.id
          }),
        }
      );
  
      const data = await res.json();
  
      if (!data?.order?.id) {
        throw new Error("Failed to create Razorpay order");
      }
  
      // 2️⃣ Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // ✅ REQUIRED
        amount: data.order.amount,
        currency: "INR",
        name: "DineDeal",
        description: "Dine-In Payment",
        order_id: data.order.id,
  
        handler: () => {
          // ❌ DO NOT update DB here
          // The realtime subscription will catch the webhook update
          toast.success("Payment processing...");
        },
  
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled");
          },
        },
  
        prefill: {
          email: user.email ?? "",
        },
  
        theme: {
          color: "#ff6a00",
        },
      };
  
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
  
    } catch (err: any) {
      console.error("DINEIN_PAYMENT_ERROR", err);
      toast.error(err.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  /* =========================
      UI STATES
  ========================= */

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <UtensilsCrossed className="h-16 w-16 mb-4" />
        <p>Scan a restaurant QR to start dine-in</p>
        <BottomNav />
      </div>
    );
  }

  /* =========================
      RENDER
  ========================= */

  return (
    <div className="min-h-screen pb-20">
      <div className="p-4">
        <Logo />
      </div>

      <div className="p-4 space-y-4">
        {session && (
          <Card>
            <CardContent className="flex gap-4 p-4">
              {session.restaurants.image_url && (
                <img
                  src={session.restaurants.image_url}
                  className="w-16 h-16 rounded-lg object-cover"
                  alt={session.restaurants.name}
                />
              )}
              <div className="flex-1">
                <h2 className="font-semibold">{session.restaurants.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {session.restaurants.address}
                </p>
              </div>
              <Badge>
                {session.status === "open"
                  ? "Active"
                  : session.status === "bill_posted"
                  ? "Bill Ready"
                  : "Paid"}
              </Badge>
            </CardContent>
          </Card>
        )}

        {session?.status === "open" && !bill && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4" />
              <p>Waiting for restaurant to post bill</p>
            </CardContent>
          </Card>
        )}

        {bill?.payment_status === "pending" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Bill</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Restaurant Bill</span>
                  <span>₹{bill.final_amount.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-success">
                    <span className="flex items-center gap-2"><Tag className="w-4 h-4" /> Coupon ({appliedCoupon.code})</span>
                    <span>- ₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                {cashbackDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span className="flex items-center gap-2"><Wallet className="w-4 h-4" /> Cashback Redeemed</span>
                    <span>- ₹{cashbackDiscount.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Pay</span>
                  <span>₹{newFinalAmount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Cashback Section */}
            {availablePoints > 0 && (
              <div className={`p-4 rounded-xl border transition-all bg-card ${(useCashback && baseAmount >= 1000) ? "border-success bg-success/5" : "border-border/40"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="p-2 bg-success/10 text-success rounded-full mt-1">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground text-sm">Reward Points</p>
                        <button onClick={() => setShowClarification(true)} className="text-muted-foreground hover:text-primary transition-colors">
                          <Info className="w-4 h-4 mt-0.5" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Balance: <span className="text-success font-medium">{availablePoints}</span> (₹{redeemableAmount})
                      </p>
                      {baseAmount < 1000 && (
                        <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Minimum bill ₹1,000 to redeem
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Only show the apply/remove toggle if they aren't using cashback OR they are but haven't entered an amount */}
                  {!useCashback || (useCashback && baseAmount < 1000) ? (
                    <Button 
                      variant="outline"
                      size="sm" 
                      onClick={() => {
                        setUseCashback(true);
                        // Default to max possible points when first clicking apply
                        const maxPts = Math.min(availablePoints, Math.floor((baseAmount - couponDiscount) * 10));
                        setPointsToRedeemInput(maxPts.toString());
                      }}
                      disabled={baseAmount < 1000 || availablePoints < 10}
                    >
                      Apply
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive/90 h-8 px-2"
                      onClick={() => {
                        setUseCashback(false);
                        setPointsToRedeemInput("");
                      }}
                    >
                      <X className="w-4 h-4 mr-1" /> Remove
                    </Button>
                  )}
                </div>

                {useCashback && baseAmount >= 1000 && (
                  <div className="mt-4 pt-4 border-t border-success/20 flex gap-2 items-center">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Points to redeem</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={pointsToRedeemInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || parseInt(val) >= 0) {
                            setPointsToRedeemInput(val);
                          }
                        }}
                        className="h-9 border-success/30 focus-visible:ring-success"
                      />
                    </div>
                    <div className="flex flex-col items-end justify-end self-end mb-1">
                        <span className="text-xs text-muted-foreground">Savings</span>
                        <span className="text-sm font-bold text-success">
                          ₹{(actualPointsToUse / 10).toFixed(2)}
                        </span>
                    </div>
                  </div>
                )}
                {useCashback && parsedPointsInput > availablePoints && (
                    <p className="text-[11px] text-destructive mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> You only have {availablePoints} points.
                    </p>
                )}
              </div>
            )}

            {/* Coupon Section */}
            {!appliedCoupon ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Coupon Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="uppercase bg-card"
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCode("");
                  }}
                  className="text-destructive hover:text-destructive/90 h-8 px-2"
                >
                  <X className="w-4 h-4" /> Remove
                </Button>
              </div>
            )}

            {/* 3️⃣ PAY BUTTON (UPDATED) */}
            <Button
              onClick={handlePayment}
              disabled={paying}
              className="w-full h-12 text-lg"
            >
              {paying ? <Loader2 className="animate-spin mr-2" /> : "Pay Now"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              GST bill will be provided by restaurant
            </p>
          </div>
        )}

        {bill?.payment_status === "completed" && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="text-green-500 flex gap-2">
                <CheckCircle2 /> Payment Successful
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center font-bold text-xl">
                ₹{bill.final_amount}
              </p>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate("/transactions")}
              >
                <Download className="mr-2 h-4 w-4" />
                View Transactions
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default DineIn;

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
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";

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
}

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
      const query = supabase
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

  /* =========================
      BILL FETCH + REALTIME
  ========================= */

  useEffect(() => {
    if (!session) return;

    fetchBill(session.id);

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
            amount: bill.final_amount,
            transactionId: bill.id,
            dineinSessionId: session.id,
            restaurantId: session.restaurant_id,
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
          <Card>
            <CardHeader>
              <CardTitle>Your Bill</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Bill Amount</span>
                <span>₹{bill.bill_amount}</span>
              </div>
              {bill.discount_amount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Discount</span>
                  <span>-₹{bill.discount_amount}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Pay</span>
                <span>₹{bill.final_amount}</span>
              </div>

              {/* 3️⃣ PAY BUTTON (UPDATED) */}
              <Button
                onClick={handlePayment}
                disabled={paying}
                className="w-full"
              >
                {paying ? "Processing..." : "Pay Now"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                GST bill will be provided by restaurant
              </p>
            </CardContent>
          </Card>
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

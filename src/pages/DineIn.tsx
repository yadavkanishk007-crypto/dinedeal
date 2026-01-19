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
  Receipt,
  CheckCircle2,
  UtensilsCrossed,
  Percent,
  CreditCard,
  Download,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { loadRazorpay, createRazorpayOptions } from "@/utils/razorpay";

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

    if (user && restaurantId) {
      initializeSession();
    }
  }, [authLoading, user, restaurantId]);

  const initializeSession = async () => {
    console.log("DINEIN_DEBUG", {
      authLoading,
      user,
      restaurantId
    });

    if (!user?.id || !restaurantId) {
      setLoading(false);
      return;
    }

    try {
      const { data: existing, error } = await supabase
        .from("dinein_sessions")
        .select(
          `
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
        `
        )
        .eq("restaurant_id", restaurantId)
        .eq("customer_id", user.id)
        .in("status", ["open", "bill_posted"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle() as any;

      if (error) throw error;

      if (existing) {
        setSession(existing as DineInSession);
        if (existing.status === "bill_posted") {
          fetchBill(existing.id);
        }
      } else {
        const { data: created, error: createError } = await supabase
          .from("dinein_sessions")
          .insert({
            restaurant_id: restaurantId,
            customer_id: user.id,
            status: "open",
          })
          .select(
            `
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
          `
          )
          .single();

        if (createError) throw createError;

        setSession(created as DineInSession);
        toast.success("Dine-in session started!");
      }
    } catch (error: any) {
        console.error("DINEIN_CREATE_FAILED", {
           message: error?.message,
           details: error,
           code: error?.code,
           hint: error?.hint
        });
        toast.error(error?.message || "Failed to start dine-in session");
   }

  };

  /* =========================
     BILL FETCH + REALTIME
  ========================= */

  useEffect(() => {
    if (!session) return;

    fetchBill(session.id);

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
      .select(
        `
        id,
        dinein_session_id,
        bill_amount,
        discount_amount,
        final_amount,
        payment_status,
        payment_reference,
        pos_bill_no,
        offer_id
      `
      )
      .eq("dinein_session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setBill(data as Transaction);
    }
  };

  /* =========================
     PAYMENT
  ========================= */

  const handlePayment = async () => {
    if (!bill || !session || !user) return;

    setPaying(true);

    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay failed to load");

      const options = createRazorpayOptions({
        amount: bill.final_amount,
        restaurantName: session.restaurants.name,
        userEmail: user.email ?? "",
        userPhone: "",
        onSuccess: async (res) => {
          await supabase
            .from("transactions")
            .update({
              payment_status: "completed",
              payment_reference: res.razorpay_payment_id,
              payment_method: "razorpay",
              platform_commission: bill.final_amount * 0.02,
              restaurant_earning: bill.final_amount * 0.98,
            })
            .eq("id", bill.id);

          await supabase
            .from("dinein_sessions")
            .update({ status: "paid" })
            .eq("id", session.id);

          setBill((b) =>
            b
              ? {
                  ...b,
                  payment_status: "completed",
                  payment_reference: res.razorpay_payment_id,
                }
              : null
          );

          toast.success("Payment successful!");
        },
        onError: () => toast.error("Payment failed"),
      });

      new (window as any).Razorpay(options).open();
    } catch (err: any) {
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

              <Button
                onClick={handlePayment}
                disabled={paying}
                className="w-full"
              >
                {paying ? (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Pay Now
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

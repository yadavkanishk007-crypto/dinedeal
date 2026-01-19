import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Clock, Receipt, CheckCircle2, UtensilsCrossed, Percent, CreditCard, Download } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { loadRazorpay, createRazorpayOptions } from "@/utils/razorpay";

interface DineInSession {
  id: string;
  restaurant_id: string;
  customer_id: string;
  status: string;
  created_at: string;
  restaurants: {
    name: string;
    address: string;
    image_url: string | null;
  };
}

interface PostedBill {
  id: string;
  session_id: string;
  bill_amount: number;
  pos_bill_no: string | null;
  discount_amount: number;
  final_amount: number;
  status: string;
  payment_reference: string | null;
  offer_id: string | null;
  offers?: {
    title: string;
    discount_percent: number;
  } | null;
}

const DineIn = () => {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const restaurantId = searchParams.get("restaurant");
  
  const [session, setSession] = useState<DineInSession | null>(null);
  const [bill, setBill] = useState<PostedBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/dine-in${restaurantId ? `?restaurant=${restaurantId}` : ''}`);
      return;
    }

    if (user) {
      initializeSession();
    }
  }, [user, authLoading, restaurantId]);

  // Subscribe to realtime updates for bills
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`bill-updates-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `session_id=eq.${session.id}`
        },
        (payload) => {
          if (payload.new) {
            fetchBill(session.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id]);

  const initializeSession = async () => {
    if (!user || !restaurantId) {
      setLoading(false);
      return;
    }

    try {
      // Check for existing open session at this restaurant
      const { data: existingSession, error: fetchError } = await supabase
        .from('dinein_sessions')
        .select(`
          *,
          restaurants (name, address, image_url)
        `)
        .eq('restaurant_id', restaurantId)
        .eq('customer_id', user.id)
        .in('status', ['open', 'bill_posted'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingSession) {
        setSession(existingSession as unknown as DineInSession);
        if (existingSession.status === 'bill_posted') {
          await fetchBill(existingSession.id);
        }
      } else {
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('dinein_sessions')
          .insert({
            restaurant_id: restaurantId,
            customer_id: user.id,
            status: 'open'
          })
          .select(`
            *,
            restaurants (name, address, image_url)
          `)
          .single();

        if (createError) throw createError;
        setSession(newSession as unknown as DineInSession);
        toast.success("Dine-in session started!");
      }
    } catch (error: any) {
      console.error('Error initializing session:', error);
      toast.error("Failed to start dine-in session");
    } finally {
      setLoading(false);
    }
  };

  const fetchBill = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        offers (title, discount_percent)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setBill(data as unknown as PostedBill);
    }
  };

  const handlePayment = async () => {
    if (!bill || !session || !user) return;

    setPaying(true);
    try {
      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded) {
        throw new Error("Failed to load payment gateway");
      }

      const options = createRazorpayOptions({
        amount: bill.final_amount,
        restaurantName: session.restaurants.name,
        userEmail: user.email || '',
        userPhone: '',
        onSuccess: async (response) => {
          // Update bill status
          const { error: billError } = await supabase
            .from('transactions')
            .update({
              status: 'paid',
              payment_reference: response.razorpay_payment_id
            })
            .eq('id', bill.id);

          if (billError) throw billError;

          // Update session status
          const { error: sessionError } = await supabase
            .from('dinein_sessions')
            .update({ status: 'paid' })
            .eq('id', session.id);

          if (sessionError) throw sessionError;

          // Create transaction record
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              user_id: user.id,
              restaurant_id: session.restaurant_id,
              bill_amount: bill.bill_amount,
              discount_amount: bill.discount_amount,
              final_amount: bill.final_amount,
              offer_id: bill.offer_id,
              payment_status: 'completed',
              payment_reference: response.razorpay_payment_id,
              payment_method: 'razorpay',
              platform_commission: bill.final_amount * 0.02,
              restaurant_earning: bill.final_amount * 0.98
            });

          if (transactionError) throw transactionError;

          setBill(prev => prev ? { ...prev, status: 'paid', payment_reference: response.razorpay_payment_id } : null);
          toast.success("Payment successful!");
        },
        onError: (error) => {
          console.error('Payment error:', error);
          toast.error("Payment failed. Please try again.");
        }
      });

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4">
          <Logo />
        </div>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <UtensilsCrossed className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Restaurant Selected</h2>
          <p className="text-muted-foreground mb-4">
            Scan a QR code at a restaurant to start your dine-in session
          </p>
          <Button onClick={() => navigate('/explore')}>
            Explore Restaurants
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4">
        <Logo />
      </div>

      <div className="p-4 space-y-4">
        {/* Restaurant Info */}
        {session && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {session.restaurants.image_url && (
                  <img 
                    src={session.restaurants.image_url} 
                    alt={session.restaurants.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h2 className="font-semibold text-lg">{session.restaurants.name}</h2>
                  <p className="text-sm text-muted-foreground">{session.restaurants.address}</p>
                </div>
                <Badge variant={session.status === 'paid' ? 'default' : 'secondary'}>
                  {session.status === 'open' && 'Active'}
                  {session.status === 'bill_posted' && 'Bill Ready'}
                  {session.status === 'paid' && 'Paid'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Cards */}
        {session?.status === 'open' && !bill && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <div className="animate-pulse">
                <Clock className="h-16 w-16 mx-auto text-primary mb-4" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Waiting for Bill</h3>
              <p className="text-muted-foreground">
                Enjoy your meal! The restaurant will post your bill here when you're ready to pay.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Bill Posted - Ready to Pay */}
        {bill && bill.status === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Your Bill
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {bill.pos_bill_no && (
                <p className="text-sm text-muted-foreground">
                  POS Bill No: {bill.pos_bill_no}
                </p>
              )}
              
              <div className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span>Bill Amount</span>
                  <span>₹{bill.bill_amount.toLocaleString('en-IN')}</span>
                </div>
                
                {bill.discount_amount > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span className="flex items-center gap-1">
                      <Percent className="h-4 w-4" />
                      DineDeal Discount
                      {bill.offers && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {bill.offers.discount_percent}% off
                        </Badge>
                      )}
                    </span>
                    <span>-₹{bill.discount_amount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-xl font-bold">
                  <span>Pay via DineDeal</span>
                  <span className="text-primary">₹{bill.final_amount.toLocaleString('en-IN')}</span>
                </div>
                
                {bill.discount_amount > 0 && (
                  <p className="text-sm text-green-500 text-center">
                    🎉 You're saving ₹{bill.discount_amount.toLocaleString('en-IN')}!
                  </p>
                )}
              </div>

              <Button 
                onClick={handlePayment} 
                className="w-full" 
                size="lg"
                disabled={paying}
              >
                {paying ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Pay ₹{bill.final_amount.toLocaleString('en-IN')}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                GST bill will be provided by the restaurant separately
              </p>
            </CardContent>
          </Card>
        )}

        {/* Payment Complete - Receipt */}
        {bill && bill.status === 'paid' && (
          <Card className="border-green-500/50">
            <CardHeader className="bg-green-500/10">
              <CardTitle className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-5 w-5" />
                Payment Successful
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-primary">
                  ₹{bill.final_amount.toLocaleString('en-IN')}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Amount Paid</p>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Bill</span>
                  <span>₹{bill.bill_amount.toLocaleString('en-IN')}</span>
                </div>
                {bill.discount_amount > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span>Discount Applied</span>
                    <span>-₹{bill.discount_amount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium">
                  <span>Amount Paid</span>
                  <span>₹{bill.final_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                {bill.pos_bill_no && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">POS Bill No</span>
                    <span>{bill.pos_bill_no}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Ref</span>
                  <span className="font-mono text-xs">{bill.payment_reference}</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={() => navigate('/transactions')}>
                <Download className="h-4 w-4 mr-2" />
                View All Transactions
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Please collect your GST bill from the restaurant
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default DineIn;

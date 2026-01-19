import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Receipt, Users, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface DineInSession {
  id: string;
  customer_id: string;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    phone: string | null;
  };
}

interface ActiveOffer {
  id: string;
  title: string;
  discount_percent: number;
  max_discount: number;
  min_order_amount: number | null;
}

interface PostBillToCustomerProps {
  restaurantId: string;
}

const PostBillToCustomer = ({ restaurantId }: PostBillToCustomerProps) => {
  const [sessions, setSessions] = useState<DineInSession[]>([]);
  const [activeOffer, setActiveOffer] = useState<ActiveOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [billAmount, setBillAmount] = useState<string>("");
  const [posBillNo, setPosBillNo] = useState<string>("");

  useEffect(() => {
    fetchData();
    
    // Subscribe to session updates
    const channel = supabase
      .channel(`restaurant-sessions-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dinein_sessions',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const fetchData = async () => {
    await Promise.all([fetchSessions(), fetchActiveOffer()]);
    setLoading(false);
  };

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('dinein_sessions')
      .select(`
        id,
        customer_id,
        status,
        created_at
      `)
      .eq('restaurant_id', restaurantId)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return;
    }

    // Fetch customer profiles separately
    if (data && data.length > 0) {
      const customerIds = data.map(s => s.customer_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', customerIds);

      const sessionsWithProfiles = data.map(session => ({
        ...session,
        profiles: profiles?.find(p => p.user_id === session.customer_id) || null
      }));

      setSessions(sessionsWithProfiles as DineInSession[]);
    } else {
      setSessions([]);
    }
  };

  const fetchActiveOffer = async () => {
    const { data, error } = await supabase
      .from('offers')
      .select('id, title, discount_percent, max_discount, min_order_amount')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .gte('valid_until', new Date().toISOString())
      .lte('valid_from', new Date().toISOString())
      .order('discount_percent', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setActiveOffer(data);
    }
  };

  const calculateDiscount = (amount: number): { discountAmount: number; finalAmount: number } => {
    if (!activeOffer) {
      return { discountAmount: 0, finalAmount: amount };
    }

    if (activeOffer.min_order_amount && amount < activeOffer.min_order_amount) {
      return { discountAmount: 0, finalAmount: amount };
    }

    const discountAmount = Math.min(
      (amount * activeOffer.discount_percent) / 100,
      activeOffer.max_discount
    );

    return {
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalAmount: Math.round((amount - discountAmount) * 100) / 100
    };
  };

  const handlePostBill = async () => {
    if (!selectedSession || !billAmount) {
      toast.error("Please select a session and enter bill amount");
      return;
    }

    const amount = parseFloat(billAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid bill amount");
      return;
    }

    setPosting(true);
    try {
      const { discountAmount, finalAmount } = calculateDiscount(amount);

      // Create posted bill
      const { error: billError } = await supabase
        .from('transactions')
        .insert({
          user_id: selectedSessionObj.customer_id,
          restaurant_id: restaurantId,
          dinein_session_id: selectedSession,
          bill_amount: amount,
          pos_bill_no: posBillNo || null,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          offer_id: activeOffer?.id || null,
          payment_status: 'pending'
        });

      if (billError) throw billError;

      // Update session status
      const { error: sessionError } = await supabase
        .from('dinein_sessions')
        .update({ status: 'bill_posted' })
        .eq('id', selectedSession);

      if (sessionError) throw sessionError;

      toast.success("Bill posted successfully!");
      
      // Reset form
      setSelectedSession("");
      setBillAmount("");
      setPosBillNo("");
      
      // Refresh sessions
      fetchSessions();
    } catch (error: any) {
      console.error('Error posting bill:', error);
      toast.error("Failed to post bill");
    } finally {
      setPosting(false);
    }
  };

  const previewDiscount = billAmount ? calculateDiscount(parseFloat(billAmount) || 0) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Dine-In Sessions
          </CardTitle>
          <CardDescription>
            Customers currently dining at your restaurant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No active dine-in sessions</p>
              <p className="text-sm mt-1">Customers will appear here when they scan your QR code</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-lg border ${
                    selectedSession === session.id ? 'border-primary bg-primary/5' : 'border-border'
                  } cursor-pointer transition-colors`}
                  onClick={() => setSelectedSession(session.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {session.profiles?.full_name || 'Guest Customer'}
                      </p>
                      {session.profiles?.phone && (
                        <p className="text-sm text-muted-foreground">{session.profiles.phone}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Started {format(new Date(session.created_at), 'h:mm a')}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post Bill Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Post Bill to Customer
          </CardTitle>
          <CardDescription>
            Enter the bill amount from your POS. DineDeal will apply discounts automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Customer Session</Label>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a customer session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.profiles?.full_name || 'Guest'} - {format(new Date(session.created_at), 'h:mm a')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billAmount">Bill Amount (₹) *</Label>
            <Input
              id="billAmount"
              type="number"
              placeholder="Enter bill amount from POS"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="posBillNo">POS Bill Number (Optional)</Label>
            <Input
              id="posBillNo"
              type="text"
              placeholder="e.g., INV-001234"
              value={posBillNo}
              onChange={(e) => setPosBillNo(e.target.value)}
            />
          </div>

          {/* Active Offer Display */}
          {activeOffer && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">Active Offer: {activeOffer.title}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {activeOffer.discount_percent}% off up to ₹{activeOffer.max_discount}
                {activeOffer.min_order_amount && activeOffer.min_order_amount > 0 && (
                  <> (min order ₹{activeOffer.min_order_amount})</>
                )}
              </p>
            </div>
          )}

          {!activeOffer && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 text-yellow-500">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">No Active Offer</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Customer will pay full amount. Create an offer to attract more customers.
              </p>
            </div>
          )}

          {/* Preview */}
          {previewDiscount && parseFloat(billAmount) > 0 && (
            <div className="p-4 rounded-lg bg-muted space-y-2">
              <p className="text-sm font-medium">Customer Will See:</p>
              <div className="flex justify-between text-sm">
                <span>Bill Amount</span>
                <span>₹{parseFloat(billAmount).toLocaleString('en-IN')}</span>
              </div>
              {previewDiscount.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-500">
                  <span>DineDeal Discount</span>
                  <span>-₹{previewDiscount.discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2 border-t">
                <span>Final Amount</span>
                <span className="text-primary">₹{previewDiscount.finalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          <Button
            onClick={handlePostBill}
            disabled={!selectedSession || !billAmount || posting}
            className="w-full"
          >
            {posting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Receipt className="h-4 w-4 mr-2" />
            )}
            Post Bill to Customer
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            GST billing is handled by your POS. DineDeal only processes the payment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostBillToCustomer;

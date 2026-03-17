import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Receipt, Users, Clock, CheckCircle2, AlertCircle, Tag } from "lucide-react";
import { format, subHours } from "date-fns";

/* =========================
   TYPES
========================= */

interface DineInSession {
  id: string;
  customer_id: string;
  status: string;
  created_at: string;
}

interface UserProfile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
}

interface ActiveReservation {
  id: string;
  user_id: string;
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

/* =========================
   COMPONENT
========================= */

const PostBillToCustomer = ({ restaurantId }: PostBillToCustomerProps) => {
  const [sessions, setSessions] = useState<DineInSession[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeReservations, setActiveReservations] = useState<ActiveReservation[]>([]);
  const [availableOffers, setAvailableOffers] = useState<ActiveOffer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string>("auto");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const [selectedSession, setSelectedSession] = useState<string>("");
  const [billAmount, setBillAmount] = useState<string>("");
  const [posBillNo, setPosBillNo] = useState<string>("");

  useEffect(() => {
    fetchData();

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
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const fetchData = async () => {
    // 1. Mark sessions older than 3 hours as expired in DB first
    const threeHoursAgo = subHours(new Date(), 3).toISOString();
    await supabase
      .from('dinein_sessions')
      .update({ status: 'expired' })
      .eq('restaurant_id', restaurantId)
      .eq('status', 'open')
      .lt('created_at', threeHoursAgo);

    // 2. Fetch fresh data
    await Promise.all([fetchSessions(threeHoursAgo), fetchAvailableOffers()]);
    setLoading(false);
  };

  const fetchSessions = async (expiryThreshold: string) => {
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('dinein_sessions')
      .select('id, status, created_at, customer_id')
      .eq('restaurant_id', restaurantId)
      .in('status', ['open', 'bill_posted'])
      .gt('created_at', expiryThreshold) // Only active within 3 hours
      .order('created_at', { ascending: false });

    if (sessionsError) return;
    setSessions(sessionsData as DineInSession[]);

    if (sessionsData && sessionsData.length > 0) {
      const customerIds = Array.from(new Set(sessionsData.map(s => s.customer_id)));
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', customerIds);

      if (profilesData) setProfiles(profilesData as UserProfile[]);
      if (profilesData) setProfiles(profilesData as UserProfile[]);

      // Check for reservations today for these customers
      const today = new Date().toISOString().split('T')[0];
      const { data: reservationsData } = await supabase
        .from('reservations')
        .select('id, user_id')
        .eq('restaurant_id', restaurantId)
        .in('user_id', customerIds)
        .eq('reservation_date', today)
        .in('status', ['confirmed', 'completed', 'pending']);
        
      if (reservationsData) setActiveReservations(reservationsData as ActiveReservation[]);
    }
  };

  const fetchAvailableOffers = async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('offers')
      .select('id, title, discount_percent, max_discount, min_order_amount')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .or(`valid_from.lte.${now},valid_from.is.null`)
      .or(`valid_until.gte.${now},valid_until.is.null`)
      .order('discount_percent', { ascending: false });

    if (data) setAvailableOffers(data);
  };

  const getEffectiveOffer = () => {
    if (selectedOfferId === "none") return null;
    if (selectedOfferId === "auto") return availableOffers[0] || null; // Highest discount
    return availableOffers.find(o => o.id === selectedOfferId) || null;
  };

  const calculateDiscount = (amount: number, customerId?: string) => {
    let baseAmount = amount;
    
    // 1. Calculate Offer Discount
    const offer = getEffectiveOffer();
    let discountAmount = 0;
    
    if (offer && (!offer.min_order_amount || amount >= offer.min_order_amount)) {
      discountAmount = Math.min((amount * offer.discount_percent) / 100, offer.max_discount);
      discountAmount = Math.round(discountAmount * 100) / 100;
    }

    // 2. Check for Reservation Advance
    let reservationAdvanceDeduction = 0;
    if (customerId && activeReservations.some(r => r.user_id === customerId)) {
      // Don't deduct more than the bill itself
      reservationAdvanceDeduction = Math.min(299, amount - discountAmount);
    }

    const totalDiscount = discountAmount + reservationAdvanceDeduction;
    const finalAmount = Math.max(Math.round((amount - totalDiscount) * 100) / 100, 0);

    return {
      discountAmount,
      reservationAdvanceDeduction,
      totalDiscount,
      finalAmount,
      offer
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
      const selectedSessionObj = sessions.find(s => s.id === selectedSession);
      if (!selectedSessionObj) throw new Error("Session not found");

      const { discountAmount, reservationAdvanceDeduction, totalDiscount, finalAmount, offer } = calculateDiscount(amount, selectedSessionObj.customer_id);

      // 1. Create the Transaction
      const { error: billError } = await supabase
        .from('transactions')
        .insert({
          user_id: selectedSessionObj.customer_id,
          restaurant_id: restaurantId,
          dinein_session_id: selectedSession,
          bill_amount: amount,
          pos_bill_no: posBillNo || null,
          discount_amount: totalDiscount, // Total discount given to user including reservation advance
          cashback_applied: 0, // Cashback from points is applied later in the DineIn flow
          restaurant_bill: amount - totalDiscount, 
          final_amount: finalAmount,
          offer_id: offer?.id || null,
          payment_status: 'pending'
        });

      if (billError) throw billError;

      // 2. Update Session Status
      const { error: sessionError } = await supabase
        .from('dinein_sessions')
        .update({ status: 'bill_posted' })
        .eq('id', selectedSession);

      if (sessionError) throw sessionError;

      toast.success("Bill posted successfully!");
      setSelectedSession("");
      setBillAmount("");
      setPosBillNo("");
      setSelectedOfferId("auto");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to post bill");
    } finally {
      setPosting(false);
    }
  };

  const getCustomerName = (customerId: string) => {
    const profile = profiles.find(p => p.user_id === customerId);
    return profile?.full_name || profile?.phone || 'Guest';
  };

  const selectedCustomerObj = sessions.find(s => s.id === selectedSession);
  const preview = billAmount ? calculateDiscount(parseFloat(billAmount) || 0, selectedCustomerObj?.customer_id) : null;

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Active Sessions (Last 3h)</CardTitle>
          <CardDescription>Sessions expire automatically after 3 hours of inactivity.</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><Clock className="mx-auto mb-2 opacity-50" /><p>No active sessions found.</p></div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} onClick={() => setSelectedSession(s.id)} className={`p-4 rounded-lg border cursor-pointer ${selectedSession === s.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {getCustomerName(s.customer_id)}
                        {activeReservations.some(r => r.user_id === s.customer_id) && (
                           <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-600 border-blue-200">Table Booked</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Started {format(new Date(s.created_at), 'h:mm a')}</p>
                    </div>
                    <Badge variant={s.status === 'bill_posted' ? 'secondary' : 'outline'}>{s.status === 'bill_posted' ? 'Bill Sent' : 'Dining'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> Post Bill</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bill Amount (₹)</Label>
            <Input type="number" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} placeholder="0.00" />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Tag className="h-4 w-4" /> Apply Offer</Label>
            <Select value={selectedOfferId} onValueChange={setSelectedOfferId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Best Available (Auto)</SelectItem>
                {availableOffers.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.title} ({o.discount_percent}%)</SelectItem>
                ))}
                <SelectItem value="none">No Discount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>POS Bill No (Optional)</Label>
            <Input value={posBillNo} onChange={(e) => setPosBillNo(e.target.value)} placeholder="INV-..." />
          </div>

          {preview && parseFloat(billAmount) > 0 && (
            <div className="p-4 rounded-lg bg-muted space-y-2">
              <div className="flex justify-between text-sm"><span>Original Bill</span><span>₹{parseFloat(billAmount).toFixed(2)}</span></div>
              
              {preview.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>DineDeal Offer ({preview.offer?.title})</span>
                  <span>-₹{preview.discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              {preview.reservationAdvanceDeduction > 0 && (
                <div className="flex justify-between text-sm text-blue-600 font-medium">
                  <span>Reservation Advance Paid</span>
                  <span>-₹{preview.reservationAdvanceDeduction.toFixed(2)}</span>
                </div>
              )}

              {preview.totalDiscount > 0 && (
                 <div className="flex justify-between text-xs text-muted-foreground pt-1">
                   <span>Total Savings Shown to Customer</span>
                   <span className="font-semibold text-green-600">₹{preview.totalDiscount.toFixed(2)}</span>
                 </div>
              )}
              
              <div className="flex justify-between font-bold pt-2 border-t mt-2">
                 <span>Customer Pays</span>
                 <span className="text-primary text-lg">₹{preview.finalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <Button className="w-full h-12 text-lg mt-2" onClick={handlePostBill} disabled={posting || !selectedSession || !billAmount}>
            {posting ? <Loader2 className="animate-spin mr-2" /> : <Receipt className="mr-2 h-5 w-5" />}
            Post Bill to Customer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostBillToCustomer;

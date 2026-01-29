import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { 
  Wallet, 
  Plus, 
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  CreditCard,
  Banknote,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";

interface Settlement {
  id: string;
  restaurant_id: string;
  restaurant_name?: string;
  period_start: string;
  period_end: string;
  total_orders: number;
  gross_amount: number;
  platform_commission: number;
  net_payable: number;
  status: string;
  payout_reference: string | null;
  payout_method: 'manual' | 'razorpay' | null;
  payout_date: string | null;
  created_at: string;
  // Fields from schema
  payout_status?: string;
  failure_reason?: string;
}

interface Restaurant {
  id: string;
  name: string;
}

interface PendingSettlement {
  restaurant_id: string;
  restaurant_name: string;
  orders_count: number;
  gross_amount: number;
  platform_commission: number;
  net_payable: number;
  min_date: string;
  max_date: string;
}

const AdminSettlements = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [pendingSettlements, setPendingSettlements] = useState<PendingSettlement[]>([]);
  
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createRestaurantId, setCreateRestaurantId] = useState("");
  const [createDateFrom, setCreateDateFrom] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [createDateTo, setCreateDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  
  const [commissionRate, setCommissionRate] = useState<string>("10");
  const [payoutMethod, setPayoutMethod] = useState<"manual" | "razorpay">("manual");
  
  const [isCreating, setIsCreating] = useState(false);
  
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // PATCH: Fetch both Restaurants AND Event Organisers
      const { data: restData } = await supabase
        .from("restaurants")
        .select("id, name")
        .eq("is_approved", true)
        .order("name");
      
      setRestaurants(restData || []);

      let query = supabase
        .from("settlements")
        .select(`
          *,
          restaurants!inner(name)
        `)
        .order("created_at", { ascending: false });

      if (selectedRestaurant !== "all") {
        query = query.eq("restaurant_id", selectedRestaurant);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: settlementsData, error } = await query;

      if (error) throw error;

      const mappedSettlements = settlementsData?.map((s: any) => ({
        ...s,
        restaurant_name: s.restaurants?.name || "Unknown",
      })) || [];

      const filteredSettlements = searchQuery 
        ? mappedSettlements.filter(s => 
            s.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.id.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : mappedSettlements;

      setSettlements(filteredSettlements);

      // PATCH: Use parseFloat for string-based values from schema
      const { data: pendingTxData } = await supabase
        .from("transactions")
        .select(`
          restaurant_id,
          final_amount,
          platform_commission,
          restaurant_earning,
          created_at,
          restaurants!inner(name)
        `)
        .eq("payment_status", "completed")
        .eq("is_settled", false)
        .is("settlement_id", null);

      const pendingMap = new Map<string, PendingSettlement>();
      pendingTxData?.forEach((tx: any) => {
        const restId = tx.restaurant_id;
        if (!pendingMap.has(restId)) {
          pendingMap.set(restId, {
            restaurant_id: restId,
            restaurant_name: tx.restaurants?.name || "Unknown",
            orders_count: 0,
            gross_amount: 0,
            platform_commission: 0,
            net_payable: 0,
            min_date: tx.created_at,
            max_date: tx.created_at,
          });
        }
        const existing = pendingMap.get(restId)!;
        existing.orders_count += 1;
        // FIX: Handle string values for precise summation
        existing.gross_amount += parseFloat(tx.final_amount || "0");
        existing.platform_commission += parseFloat(tx.platform_commission || "0");
        existing.net_payable += parseFloat(tx.restaurant_earning || "0");
        if (tx.created_at < existing.min_date) existing.min_date = tx.created_at;
        if (tx.created_at > existing.max_date) existing.max_date = tx.created_at;
      });

      setPendingSettlements(Array.from(pendingMap.values()));
    } catch (error) {
      console.error("Error fetching settlements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedRestaurant, statusFilter, searchQuery]);

  useEffect(() => {
    if (createRestaurantId) {
      const pending = pendingSettlements.find(p => p.restaurant_id === createRestaurantId);
      if (pending && pending.gross_amount > 0) {
        const calculatedRate = (pending.platform_commission / pending.gross_amount) * 100;
        setCommissionRate(calculatedRate.toFixed(2));
      } else {
        setCommissionRate("10");
      }
    }
  }, [createRestaurantId, pendingSettlements]);

  const createSettlement = async () => {
    if (!createRestaurantId) {
      toast({ title: "Error", description: "Please select a business", variant: "destructive" });
      return;
    }

    const commRate = parseFloat(commissionRate);
    if (isNaN(commRate) || commRate < 0 || commRate > 100) {
      toast({ title: "Error", description: "Invalid commission rate", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("id, final_amount")
        .eq("restaurant_id", createRestaurantId)
        .eq("payment_status", "completed")
        .eq("is_settled", false)
        .is("settlement_id", null)
        .gte("created_at", new Date(createDateFrom).toISOString())
        .lte("created_at", new Date(createDateTo + "T23:59:59").toISOString());

      if (txError) throw txError;

      if (!txData || txData.length === 0) {
        toast({ title: "No Transactions", description: "No unsettled transactions found for this period", variant: "destructive" });
        setIsCreating(false);
        return;
      }

      const totalOrders = txData.length;
      const grossAmount = txData.reduce((sum, t) => sum + parseFloat(t.final_amount || "0"), 0);
      const platformCommission = grossAmount * (commRate / 100);
      const netPayable = grossAmount - platformCommission;

      const { data: settlement, error: settError } = await supabase
        .from("settlements")
        .insert({
          restaurant_id: createRestaurantId,
          period_start: new Date(createDateFrom).toISOString(),
          period_end: new Date(createDateTo + "T23:59:59").toISOString(),
          total_orders: totalOrders,
          gross_amount: grossAmount.toString(), // Store as string to match schema
          platform_commission: platformCommission.toString(),
          net_payable: netPayable.toString(),
          status: "pending",
          payout_method: payoutMethod,
        })
        .select()
        .single();

      if (settError) throw settError;

      const txIds = txData.map(t => t.id);
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ settlement_id: settlement.id }) 
        .in("id", txIds);

      if (updateError) throw updateError;
      
      setPendingSettlements(prev => prev.filter(p => p.restaurant_id !== createRestaurantId));

      await logAction({
        action: "create_settlement",
        entity_type: "settlement",
        entity_id: settlement.id,
        details: { 
          restaurant_id: createRestaurantId, 
          net_payable: netPayable,
          commission_rate: commRate,
          payout_method: payoutMethod 
        },
      });

      toast({ 
        title: "Settlement Created", 
        description: `Generated pending settlement for payout.` 
      });
      setIsCreateDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error creating settlement:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "processing":
        return <Badge className="bg-blue-500 text-white"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "failed":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>;

  return (
    <div className="space-y-6">
      {pendingSettlements.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Pending Settlements ({pendingSettlements.length} Partners)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {pendingSettlements.slice(0, 6).map((ps) => (
                <div key={ps.restaurant_id} className="p-3 rounded-lg border bg-background flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{ps.restaurant_name}</p>
                    <p className="text-xs text-muted-foreground">{ps.orders_count} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">₹{ps.net_payable.toFixed(2)}</p>
                    <Button size="sm" variant="outline" className="mt-1 h-7 text-xs" onClick={() => {
                        setCreateRestaurantId(ps.restaurant_id);
                        setCreateDateFrom(format(new Date(ps.min_date), "yyyy-MM-dd"));
                        setCreateDateTo(format(new Date(ps.max_date), "yyyy-MM-dd"));
                        setIsCreateDialogOpen(true);
                      }}>Settle</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Partner Settlements
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />Create Settlement</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Create New Settlement</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Business Partner</Label>
                  <Select value={createRestaurantId} onValueChange={setCreateRestaurantId}>
                    <SelectTrigger><SelectValue placeholder="Select partner" /></SelectTrigger>
                    <SelectContent>
                      {restaurants.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>From Date</Label><Input type="date" value={createDateFrom} onChange={(e) => setCreateDateFrom(e.target.value)} /></div>
                  <div className="space-y-2"><Label>To Date</Label><Input type="date" value={createDateTo} onChange={(e) => setCreateDateTo(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Commission (%)</Label><Input type="number" step="0.1" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>Method</Label>
                    <Select value={payoutMethod} onValueChange={(val: any) => setPayoutMethod(val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Transfer</SelectItem>
                        <SelectItem value="razorpay">Razorpay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={createSettlement} disabled={isCreating}>{isCreating ? "Processing..." : "Initiate Settlement"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}><SelectTrigger className="w-48"><SelectValue placeholder="All Partners" /></SelectTrigger><SelectContent><SelectItem value="all">All Partners</SelectItem>{restaurants.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Settlement ID</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead className="text-right">Net Payable</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell className="font-mono text-xs uppercase">#{settlement.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{settlement.restaurant_name}</TableCell>
                    <TableCell className="text-sm">{format(new Date(settlement.period_start), "dd MMM")} → {format(new Date(settlement.period_end), "dd MMM")}</TableCell>
                    <TableCell className="text-center">{settlement.total_orders}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      ₹{parseFloat(settlement.net_payable as any || "0").toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{getStatusBadge(settlement.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(settlement.created_at), "dd MMM yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettlements;

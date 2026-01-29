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
  Info,
  CalendarDays
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

// Fixed Type definitions to match Supabase return types
interface Entity {
  id: string;
  name: string;
  is_event_organiser: boolean;
  organiser_type: 'restaurant' | 'event_group';
}

interface Settlement {
  id: string;
  restaurant_id: string;
  restaurant_name?: string;
  is_event?: boolean;
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
}

interface PendingSettlement {
  restaurant_id: string;
  entity_name: string;
  organiser_type: 'restaurant' | 'event_group';
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
  const [entities, setEntities] = useState<Entity[]>([]);
  const [pendingSettlements, setPendingSettlements] = useState<PendingSettlement[]>([]);
  
  const [selectedEntity, setSelectedEntity] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createEntityId, setCreateEntityId] = useState("");
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
      const { data: rawRestData, error: restError } = await supabase
        .from("restaurants")
        .select("id, name, is_event_organiser, organiser_type")
        .eq("is_approved", true);
      
      if (restError) throw restError;

      // Type assertion to ensure 'string' from DB matches our union type
      const validatedEntities = (rawRestData || []).map(item => ({
        ...item,
        organiser_type: (item.organiser_type === 'event_group' ? 'event_group' : 'restaurant') as 'restaurant' | 'event_group'
      }));
      
      setEntities(validatedEntities);

      let query = supabase
        .from("settlements")
        .select(`
          *,
          restaurants!inner(name, is_event_organiser)
        `)
        .order("created_at", { ascending: false });

      if (selectedEntity !== "all") query = query.eq("restaurant_id", selectedEntity);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);

      const { data: settlementsData, error: settError } = await query;
      if (settError) throw settError;

      const mappedSettlements = settlementsData?.map((s: any) => ({
        ...s,
        restaurant_name: s.restaurants?.name || "Unknown",
        is_event: s.restaurants?.is_event_organiser
      })) || [];

      setSettlements(searchQuery 
        ? mappedSettlements.filter(s => s.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase()))
        : mappedSettlements
      );

      const { data: pendingTxData, error: txError } = await supabase
        .from("transactions")
        .select(`
          restaurant_id,
          final_amount,
          platform_commission,
          restaurant_earning,
          created_at,
          restaurants!inner(name, organiser_type)
        `)
        .eq("payment_status", "completed")
        .is("settlement_id", null);

      if (txError) throw txError;

      const pendingMap = new Map<string, PendingSettlement>();
      pendingTxData?.forEach((tx: any) => {
        const id = tx.restaurant_id;
        if (!pendingMap.has(id)) {
          pendingMap.set(id, {
            restaurant_id: id,
            entity_name: tx.restaurants?.name || "Unknown",
            organiser_type: (tx.restaurants?.organiser_type === 'event_group' ? 'event_group' : 'restaurant') as 'restaurant' | 'event_group',
            orders_count: 0,
            gross_amount: 0,
            platform_commission: 0,
            net_payable: 0,
            min_date: tx.created_at,
            max_date: tx.created_at,
          });
        }
        const existing = pendingMap.get(id)!;
        existing.orders_count += 1;
        existing.gross_amount += Number(tx.final_amount || 0);
        existing.platform_commission += Number(tx.platform_commission || 0);
        existing.net_payable += Number(tx.restaurant_earning || 0);
        if (tx.created_at < existing.min_date) existing.min_date = tx.created_at;
        if (tx.created_at > existing.max_date) existing.max_date = tx.created_at;
      });

      setPendingSettlements(Array.from(pendingMap.values()));
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast({ title: "Fetch Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedEntity, statusFilter, searchQuery]);

  useEffect(() => {
    if (createEntityId) {
      const entity = entities.find(e => e.id === createEntityId);
      if (entity?.organiser_type === 'event_group') {
        setCommissionRate("0");
      } else {
        const pending = pendingSettlements.find(p => p.restaurant_id === createEntityId);
        if (pending && pending.gross_amount > 0) {
          setCommissionRate(((pending.platform_commission / pending.gross_amount) * 100).toFixed(2));
        } else {
          setCommissionRate("10");
        }
      }
    }
  }, [createEntityId, pendingSettlements, entities]);

  const createSettlement = async () => {
    if (!createEntityId) return;
    const commRate = parseFloat(commissionRate);

    setIsCreating(true);
    try {
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("id, final_amount")
        .eq("restaurant_id", createEntityId)
        .eq("payment_status", "completed")
        .is("settlement_id", null)
        .gte("created_at", new Date(createDateFrom).toISOString())
        .lte("created_at", new Date(createDateTo + "T23:59:59").toISOString());

      if (txError || !txData?.length) throw new Error("No unsettled transactions found.");

      const grossAmount = txData.reduce((sum, t) => sum + Number(t.final_amount), 0);
      const platformCommission = grossAmount * (commRate / 100);
      const netPayableCalculated = grossAmount - platformCommission;

      const { data: settlement, error: settError } = await supabase
        .from("settlements")
        .insert({
          restaurant_id: createEntityId,
          period_start: new Date(createDateFrom).toISOString(),
          period_end: new Date(createDateTo + "T23:59:59").toISOString(),
          total_orders: txData.length,
          gross_amount: grossAmount,
          platform_commission: platformCommission,
          net_payable: netPayableCalculated,
          status: "pending",
          payout_method: payoutMethod,
        })
        .select().single();

      if (settError) throw settError;

      await supabase.from("transactions").update({ settlement_id: settlement.id }).in("id", txData.map(t => t.id));

      await logAction({
        action: "create_settlement",
        entity_type: "settlement",
        entity_id: settlement.id,
        details: { net_payable: netPayableCalculated, commission_rate: commRate },
      });

      toast({ title: "Success", description: "Settlement initiated." });
      setIsCreateDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      completed: <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>,
      processing: <Badge className="bg-blue-500 text-white"><Clock className="w-3 h-3 mr-1" />Processing</Badge>,
      pending: <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>,
      failed: <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>,
    };
    return badges[status] || <Badge variant="outline">{status}</Badge>;
  };

  if (isLoading && entities.length === 0) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      {pendingSettlements.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-yellow-500" />Ready for Settlement</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {pendingSettlements.slice(0, 6).map((ps) => (
                <div key={ps.restaurant_id} className="p-3 rounded-lg border bg-background flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {ps.organiser_type === 'event_group' ? <CalendarDays className="w-4 h-4 text-blue-500" /> : <Wallet className="w-4 h-4 text-green-500" />}
                    <div><p className="font-medium text-sm">{ps.entity_name}</p><p className="text-xs text-muted-foreground">{ps.orders_count} txns</p></div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">₹{ps.net_payable.toFixed(2)}</p>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                        setCreateEntityId(ps.restaurant_id);
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2"><Wallet className="w-4 h-4" />History</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />New Settlement</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Initiate Payout</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Entity</Label>
                  <Select value={createEntityId} onValueChange={setCreateEntityId}>
                    <SelectTrigger><SelectValue placeholder="Select entity" /></SelectTrigger>
                    <SelectContent>
                      {entities.map(e => <SelectItem key={e.id} value={e.id}>{e.name} ({e.organiser_type === 'event_group' ? 'Event' : 'Rest'})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>From</Label><Input type="date" value={createDateFrom} onChange={(e) => setCreateDateFrom(e.target.value)} /></div>
                  <div className="space-y-2"><Label>To</Label><Input type="date" value={createDateTo} onChange={(e) => setCreateDateTo(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Comm %</Label><Input type="number" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Method</Label>
                    <Select value={payoutMethod} onValueChange={(v: any) => setPayoutMethod(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="manual">Manual</SelectItem><SelectItem value="razorpay">Razorpay</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter><Button onClick={createSettlement} disabled={isCreating}>{isCreating ? "Saving..." : "Create Settlement"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search entity..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8" />
            </div>
            <Select value={selectedEntity} onValueChange={setSelectedEntity}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Entities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entities.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Net Payable</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.restaurant_name}</TableCell>
                    <TableCell>{s.is_event ? <Badge className="bg-blue-50 text-blue-700 border-blue-200" variant="outline">Event</Badge> : <Badge variant="outline">Rest</Badge>}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">₹{Number(s.net_payable).toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(s.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(s.created_at), "dd MMM yy")}</TableCell>
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

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format, addDays } from "date-fns";
import { 
  Wallet, 
  Clock, 
  Calendar, 
  CheckCircle,
  Info,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface RestaurantSettlementsTabProps {
  restaurantId: string;
}

interface SettlementSummary {
  totalSettled: number;
  pendingSettlement: number;
  nextSettlementDate: string;
}

interface Settlement {
  id: string;
  period_start: string;
  period_end: string;
  total_orders: number;
  net_payable: number;
  status: string;
  payout_date: string | null;
  payout_reference: string | null;
  created_at: string;
}

const RestaurantSettlementsTab = ({ restaurantId }: RestaurantSettlementsTabProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<SettlementSummary>({
    totalSettled: 0,
    pendingSettlement: 0,
    nextSettlementDate: format(addDays(new Date(), 7), "dd MMM yyyy"),
  });
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch settlements
      const { data: settlementsData, error } = await supabase
        .from("settlements")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSettlements(settlementsData || []);

      // Calculate summary
      const completedSettlements = settlementsData?.filter(s => s.status === "completed") || [];
      const totalSettled = completedSettlements.reduce((sum, s) => sum + Number(s.net_payable), 0);

      // Get pending amount from unsettled transactions
      const { data: pendingTx } = await supabase
        .from("transactions")
        .select("restaurant_earning")
        .eq("restaurant_id", restaurantId)
        .eq("payment_status", "completed")
        .eq("is_settled", false);

      const pendingSettlement = pendingTx?.reduce((sum, t) => sum + Number(t.restaurant_earning || 0), 0) || 0;

      // Calculate next settlement date (next Monday)
      const today = new Date();
      const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
      const nextMonday = addDays(today, daysUntilMonday);

      setSummary({
        totalSettled,
        pendingSettlement,
        nextSettlementDate: format(nextMonday, "dd MMM yyyy"),
      });
    } catch (error) {
      console.error("Error fetching settlements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [restaurantId]);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Automatic Settlements</AlertTitle>
        <AlertDescription>
          Settlements are processed automatically by DineDeal as per policy. Payouts are typically processed weekly on Mondays.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground">Total Settled</p>
              <p className="text-2xl font-display font-bold text-foreground">
                ₹{summary.totalSettled.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-xs text-muted-foreground">Pending Settlement</p>
              <p className="text-2xl font-display font-bold text-foreground">
                ₹{summary.pendingSettlement.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground">Next Expected Settlement</p>
              <p className="text-2xl font-display font-bold text-foreground">
                {summary.nextSettlementDate}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Settlement History */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Settlement History</CardTitle>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No settlements yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your first settlement will appear here once processed
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Settlement ID</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-center">Orders</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Settlement Date</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map((settlement) => (
                    <TableRow key={settlement.id}>
                      <TableCell className="font-mono text-sm">
                        #{settlement.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(settlement.period_start), "dd MMM")} → {format(new Date(settlement.period_end), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-center">
                        {settlement.total_orders}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        ₹{Number(settlement.net_payable).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(settlement.status)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {settlement.payout_date 
                          ? format(new Date(settlement.payout_date), "dd MMM yyyy")
                          : "-"
                        }
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {settlement.payout_reference || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RestaurantSettlementsTab;

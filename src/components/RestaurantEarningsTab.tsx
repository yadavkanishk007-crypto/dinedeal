import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  DollarSign, 
  Clock, 
  Calendar, 
  TrendingUp,
  Download,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface RestaurantEarningsTabProps {
  restaurantId: string;
}

interface EarningsSummary {
  totalEarnings: number;
  pendingAmount: number;
  lastSettlementDate: string | null;
  platformCommissionPaid: number;
}

interface Transaction {
  id: string;
  created_at: string;
  final_amount: number;
  platform_commission: number;
  restaurant_earning: number;
  payment_status: string;
  is_settled: boolean;
}

const RestaurantEarningsTab = ({ restaurantId }: RestaurantEarningsTabProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarnings: 0,
    pendingAmount: 0,
    lastSettlementDate: null,
    platformCommissionPaid: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Build query
      let query = supabase
        .from("transactions")
        .select("id, created_at, final_amount, platform_commission, restaurant_earning, payment_status, is_settled")
        .eq("restaurant_id", restaurantId)
        .eq("payment_status", "completed")
        .order("created_at", { ascending: false });

      if (dateFrom) {
        query = query.gte("created_at", new Date(dateFrom).toISOString());
      }
      if (dateTo) {
        query = query.lte("created_at", new Date(dateTo + "T23:59:59").toISOString());
      }

      const { data: txData, error } = await query;

      if (error) throw error;

      // Calculate summary from DB data
      const totalEarnings = txData?.reduce((sum, t) => sum + Number(t.restaurant_earning || 0), 0) || 0;
      const pendingAmount = txData?.filter(t => !t.is_settled).reduce((sum, t) => sum + Number(t.restaurant_earning || 0), 0) || 0;
      const platformCommissionPaid = txData?.reduce((sum, t) => sum + Number(t.platform_commission || 0), 0) || 0;

      // Get last settlement date
      const { data: lastSettlement } = await supabase
        .from("settlements")
        .select("period_end")
        .eq("restaurant_id", restaurantId)
        .eq("status", "completed")
        .order("period_end", { ascending: false })
        .limit(1)
        .maybeSingle();

      setSummary({
        totalEarnings,
        pendingAmount,
        lastSettlementDate: lastSettlement?.period_end || null,
        platformCommissionPaid,
      });

      // Apply status filter for display
      let filteredTx = txData || [];
      if (statusFilter === "settled") {
        filteredTx = filteredTx.filter(t => t.is_settled);
      } else if (statusFilter === "pending") {
        filteredTx = filteredTx.filter(t => !t.is_settled);
      }

      setTransactions(filteredTx);
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [restaurantId, dateFrom, dateTo, statusFilter]);

  const exportCSV = () => {
    const headers = ["Date", "Order ID", "Customer Paid", "Platform Commission", "Restaurant Earning", "Status"];
    const rows = transactions.map(t => [
      format(new Date(t.created_at), "yyyy-MM-dd HH:mm"),
      t.id.slice(0, 8),
      t.final_amount.toFixed(2),
      t.platform_commission.toFixed(2),
      t.restaurant_earning.toFixed(2),
      t.is_settled ? "Settled" : "Pending"
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `earnings-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground">Total Earnings</p>
              <p className="text-2xl font-display font-bold text-foreground">
                ₹{summary.totalEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-xs text-muted-foreground">Pending Amount</p>
              <p className="text-2xl font-display font-bold text-foreground">
                ₹{summary.pendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
              <p className="text-xs text-muted-foreground">Last Settlement</p>
              <p className="text-2xl font-display font-bold text-foreground">
                {summary.lastSettlementDate 
                  ? format(new Date(summary.lastSettlementDate), "dd MMM") 
                  : "None"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-xs text-muted-foreground">Commission Paid</p>
              <p className="text-2xl font-display font-bold text-foreground">
                ₹{summary.platformCommissionPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Earnings Breakdown
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">From:</span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">To:</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Earnings Table */}
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No earnings found for the selected period</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead className="text-right">Customer Paid</TableHead>
                    <TableHead className="text-right">Platform Fee</TableHead>
                    <TableHead className="text-right">Your Earning</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">
                        {format(new Date(tx.created_at), "dd MMM yyyy, HH:mm")}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        #{tx.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{Number(tx.final_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        ₹{Number(tx.platform_commission).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        ₹{Number(tx.restaurant_earning).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.is_settled ? "default" : "secondary"}>
                          {tx.is_settled ? "Settled" : "Pending"}
                        </Badge>
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

export default RestaurantEarningsTab;

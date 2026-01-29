import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  DollarSign, 
  Clock, 
  Calendar, 
  TrendingUp,
  Download,
  Filter,
  CalendarDays
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
  event_group_id?: string | null;
}

const RestaurantEarningsTab = ({ restaurantId }: RestaurantEarningsTabProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isEventGroup, setIsEventGroup] = useState(false);
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
      // 1. Determine if this is a restaurant or event group
      const { data: entityData } = await supabase
        .from("restaurants")
        .select("organiser_type")
        .eq("id", restaurantId)
        .single();

      const isEvent = entityData?.organiser_type === 'event_group';
      setIsEventGroup(isEvent);

      // 2. Fetch Transactions
      let txQuery = supabase
        .from("transactions")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("payment_status", "completed")
        .order("created_at", { ascending: false });

      if (dateFrom) txQuery = txQuery.gte("created_at", new Date(dateFrom).toISOString());
      if (dateTo) txQuery = txQuery.lte("created_at", new Date(dateTo + "T23:59:59").toISOString());

      const { data: txData, error: txError } = await txQuery;
      if (txError) throw txError;

      // 3. Fetch Completed Settlements for Historical Totals
      const { data: settData } = await supabase
        .from("settlements")
        .select("net_payable, platform_commission, period_end")
        .eq("restaurant_id", restaurantId)
        .eq("status", "completed");

      const totalEarnings = settData?.reduce((sum, s) => sum + Number(s.net_payable || 0), 0) || 0;
      const platformCommissionPaid = settData?.reduce((sum, s) => sum + Number(s.platform_commission || 0), 0) || 0;
      
      // Calculate pending amount from current unsettled transactions
      const pendingAmount = txData?.filter(t => !t.is_settled).reduce((sum, t) => sum + Number(t.restaurant_earning || 0), 0) || 0;

      // Get last settlement date
      const lastSettlementDate = settData?.length 
        ? settData.sort((a, b) => new Date(b.period_end).getTime() - new Date(a.period_end).getTime())[0].period_end 
        : null;

      setSummary({
        totalEarnings,
        pendingAmount,
        lastSettlementDate,
        platformCommissionPaid,
      });

      // Apply UI filter
      let filteredTx = txData || [];
      if (statusFilter === "settled") filteredTx = filteredTx.filter(t => t.is_settled);
      else if (statusFilter === "pending") filteredTx = filteredTx.filter(t => !t.is_settled);

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
    const headers = ["Date", "Order ID", "Customer Paid", "Fee", "Your Earning", "Status"];
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
    a.download = `earnings-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Earned" 
          value={summary.totalEarnings} 
          icon={<DollarSign className="w-5 h-5 text-green-500" />} 
          color="bg-green-500/10" 
        />
        <StatCard 
          title="Pending Settlement" 
          value={summary.pendingAmount} 
          icon={<Clock className="w-5 h-5 text-yellow-500" />} 
          color="bg-yellow-500/10" 
        />
        <StatCard 
          title="Last Settlement" 
          value={summary.lastSettlementDate ? format(new Date(summary.lastSettlementDate), "dd MMM") : "None"} 
          icon={isEventGroup ? <CalendarDays className="w-5 h-5 text-blue-500" /> : <Calendar className="w-5 h-5 text-blue-500" />} 
          color="bg-blue-500/10"
          isRawValue 
        />
        <StatCard 
          title="Fees Paid" 
          value={summary.platformCommissionPaid} 
          icon={<TrendingUp className="w-5 h-5 text-purple-500" />} 
          color="bg-purple-500/10" 
        />
      </div>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Transaction History {isEventGroup && <Badge variant="outline" className="ml-2">Event Group</Badge>}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">{format(new Date(tx.created_at), "dd MMM, HH:mm")}</TableCell>
                    <TableCell className="text-right">₹{tx.final_amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">₹{tx.platform_commission.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">₹{tx.restaurant_earning.toLocaleString()}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, isRawValue = false }: any) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
          {icon}
        </div>
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-2xl font-display font-bold text-foreground">
          {isRawValue ? value : `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
        </p>
      </CardContent>
    </Card>
  </motion.div>
);

export default RestaurantEarningsTab;

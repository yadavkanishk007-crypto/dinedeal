import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Store, 
  TrendingUp, 
  DollarSign,
  Download,
  Filter,
  Search,
  CalendarDays
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface RestaurantEarning {
  restaurant_id: string;
  restaurant_name: string;
  organiser_type: 'restaurant' | 'event_group';
  gross_revenue: number;
  platform_commission: number;
  net_payable: number;
  orders_count: number;
}

const AdminRestaurantEarnings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState<RestaurantEarning[]>([]);
  const [restaurants, setRestaurants] = useState<{ id: string; name: string; organiser_type: string }[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [totals, setTotals] = useState({
    grossRevenue: 0,
    platformCommission: 0,
    netPayable: 0,
    totalOrders: 0,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch all restaurants/entities for filters
      const { data: restData } = await supabase
        .from("restaurants")
        .select("id, name, organiser_type")
        .order("name");
      
      setRestaurants(restData || []);

      // 2. Query the Settlements table for completed payouts
      let query = supabase
        .from("settlements")
        .select(`
          id,
          restaurant_id,
          total_orders,
          gross_amount,
          platform_commission,
          net_payable,
          period_start,
          period_end,
          restaurants!inner(name, organiser_type)
        `)
        .eq("status", "completed");

      if (selectedRestaurant !== "all") {
        query = query.eq("restaurant_id", selectedRestaurant);
      }
      if (dateFrom) {
        query = query.gte("period_start", new Date(dateFrom).toISOString());
      }
      if (dateTo) {
        query = query.lte("period_end", new Date(dateTo + "T23:59:59").toISOString());
      }

      const { data: settlementData, error } = await query;
      if (error) throw error;

      // 3. Aggregate data by entity
      const earningsMap = new Map<string, RestaurantEarning>();
      
      settlementData?.forEach((settlement: any) => {
        const restId = settlement.restaurant_id;
        const restName = settlement.restaurants?.name || "Unknown";
        const type = (settlement.restaurants?.organiser_type === 'event_group' ? 'event_group' : 'restaurant') as 'restaurant' | 'event_group';
        
        if (!earningsMap.has(restId)) {
          earningsMap.set(restId, {
            restaurant_id: restId,
            restaurant_name: restName,
            organiser_type: type,
            gross_revenue: 0,
            platform_commission: 0,
            net_payable: 0,
            orders_count: 0,
          });
        }
        
        const existing = earningsMap.get(restId)!;
        
        existing.gross_revenue += parseFloat(String(settlement.gross_amount || "0"));
        existing.platform_commission += parseFloat(String(settlement.platform_commission || "0"));
        existing.net_payable += parseFloat(String(settlement.net_payable || "0"));
        existing.orders_count += settlement.total_orders || 0;
      });

      let earningsArray = Array.from(earningsMap.values());
      
      if (searchQuery) {
        earningsArray = earningsArray.filter(e => 
          e.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      earningsArray.sort((a, b) => b.gross_revenue - a.gross_revenue);
      setEarnings(earningsArray);

      // 4. Calculate Summary Totals
      const grossRevenue = earningsArray.reduce((sum, e) => sum + e.gross_revenue, 0);
      const platformCommission = earningsArray.reduce((sum, e) => sum + e.platform_commission, 0);
      const netPayable = earningsArray.reduce((sum, e) => sum + e.net_payable, 0);
      const totalOrders = earningsArray.reduce((sum, e) => sum + e.orders_count, 0);

      setTotals({ grossRevenue, platformCommission, netPayable, totalOrders });
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedRestaurant, dateFrom, dateTo, searchQuery]);

  const exportCSV = () => {
    const headers = ["Type", "Name", "Gross Revenue", "Platform Commission", "Net Payable", "Orders"];
    const rows = earnings.map(e => [
      e.organiser_type,
      e.restaurant_name,
      e.gross_revenue.toFixed(2),
      e.platform_commission.toFixed(2),
      e.net_payable.toFixed(2),
      e.orders_count.toString()
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Gross Revenue" value={totals.grossRevenue} icon={<DollarSign className="text-green-500" />} color="bg-green-500/10" />
        <StatCard title="Commission" value={totals.platformCommission} icon={<TrendingUp className="text-purple-500" />} color="bg-purple-500/10" />
        <StatCard title="Net Payouts" value={totals.netPayable} icon={<DollarSign className="text-blue-500" />} color="bg-blue-500/10" />
        <StatCard title="Total Orders" value={totals.totalOrders} icon={<Store className="text-orange-500" />} color="bg-orange-500/10" isCurrency={false} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2"><Filter className="w-4 h-4" />Settled Earnings Report</CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-2" />Export</Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Entities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {restaurants.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name} ({r.organiser_type === 'event_group' ? 'Event' : 'Rest'})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity Name</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Net Payable</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earnings.map((e) => (
                  <TableRow key={e.restaurant_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {e.organiser_type === 'event_group' ? <CalendarDays className="w-3 h-3 text-blue-500" /> : <Store className="w-3 h-3 text-green-500" />}
                        <span className="font-medium">{e.restaurant_name}</span>
                        {e.organiser_type === 'event_group' && <Badge variant="secondary" className="text-[10px] h-4">Event</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">₹{e.gross_revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-purple-600">₹{e.platform_commission.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">₹{e.net_payable.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{e.orders_count}</TableCell>
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

const StatCard = ({ title, value, icon, color, isCurrency = true }: any) => (
  <Card>
    <CardContent className="p-4 flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-1">
          {isCurrency ? `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : value.toLocaleString()}
        </p>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
    </CardContent>
  </Card>
);

export default AdminRestaurantEarnings;

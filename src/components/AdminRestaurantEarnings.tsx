import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Store, 
  TrendingUp, 
  DollarSign,
  Download,
  Filter,
  Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface RestaurantEarning {
  restaurant_id: string;
  restaurant_name: string;
  gross_revenue: number;
  platform_commission: number;
  net_payable: number;
  orders_count: number;
}

const AdminRestaurantEarnings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState<RestaurantEarning[]>([]);
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Summary stats
  const [totals, setTotals] = useState({
    grossRevenue: 0,
    platformCommission: 0,
    netPayable: 0,
    totalOrders: 0,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all restaurants for filter dropdown
      const { data: restData } = await supabase
        .from("restaurants")
        .select("id, name")
        .order("name");
      
      setRestaurants(restData || []);

      // Build transaction query
      let query = supabase
        .from("transactions")
        .select(`
          id,
          final_amount,
          platform_commission,
          restaurant_earning,
          restaurant_id,
          created_at,
          restaurants!inner(name)
        `)
        .eq("payment_status", "completed");

      if (selectedRestaurant !== "all") {
        query = query.eq("restaurant_id", selectedRestaurant);
      }
      if (dateFrom) {
        query = query.gte("created_at", new Date(dateFrom).toISOString());
      }
      if (dateTo) {
        query = query.lte("created_at", new Date(dateTo + "T23:59:59").toISOString());
      }

      const { data: txData, error } = await query;

      if (error) throw error;

      // Aggregate by restaurant
      const earningsMap = new Map<string, RestaurantEarning>();
      
      txData?.forEach((tx: any) => {
        const restId = tx.restaurant_id;
        const restName = tx.restaurants?.name || "Unknown";
        
        if (!earningsMap.has(restId)) {
          earningsMap.set(restId, {
            restaurant_id: restId,
            restaurant_name: restName,
            gross_revenue: 0,
            platform_commission: 0,
            net_payable: 0,
            orders_count: 0,
          });
        }
        
        const existing = earningsMap.get(restId)!;
        // FIX: Ensure decimal precision using parseFloat and explicit string fallback
        existing.gross_revenue += parseFloat(tx.final_amount || "0");
        existing.platform_commission += parseFloat(tx.platform_commission || "0");
        existing.net_payable += parseFloat(tx.restaurant_earning || "0");
        existing.orders_count += 1;
      });

      let earningsArray = Array.from(earningsMap.values());
      
      // Apply search filter
      if (searchQuery) {
        earningsArray = earningsArray.filter(e => 
          e.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Sort by gross revenue descending
      earningsArray.sort((a, b) => b.gross_revenue - a.gross_revenue);

      setEarnings(earningsArray);

      // Calculate totals
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
    const headers = ["Restaurant Name", "Gross Revenue", "Platform Commission", "Net Payable", "Orders Count"];
    const rows = earnings.map(e => [
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
    a.download = `restaurant-earnings-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
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
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gross Revenue</p>
                <p className="text-2xl font-bold mt-1">₹{totals.grossRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Platform Commission</p>
                <p className="text-2xl font-bold mt-1">₹{totals.platformCommission.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Payable</p>
                <p className="text-2xl font-bold mt-1">₹{totals.netPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold mt-1">{totals.totalOrders.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Store className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Restaurant Earnings
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search restaurant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Restaurants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Restaurants</SelectItem>
                {restaurants.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          </div>

          {earnings.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No earnings data found</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Restaurant Name</TableHead>
                    <TableHead className="text-right">Gross Revenue</TableHead>
                    <TableHead className="text-right">Platform Commission</TableHead>
                    <TableHead className="text-right">Net Payable</TableHead>
                    <TableHead className="text-center">Orders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.map((earning) => (
                    <TableRow key={earning.restaurant_id}>
                      <TableCell className="font-medium">{earning.restaurant_name}</TableCell>
                      <TableCell className="text-right">
                        ₹{earning.gross_revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-purple-600">
                        ₹{earning.platform_commission.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        ₹{earning.net_payable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">{earning.orders_count}</TableCell>
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

export default AdminRestaurantEarnings;

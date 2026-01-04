import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface AnalyticsData {
  usersByRole: { name: string; value: number; color: string }[];
  signupsByMonth: { month: string; customers: number; restaurants: number }[];
  topRestaurants: { name: string; revenue: number; transactions: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  avgOrderValue: number;
  totalCustomers: number;
  totalRestaurants: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--gold))", "hsl(var(--accent))"];

const AdminAnalyticsCharts = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    usersByRole: [],
    signupsByMonth: [],
    topRestaurants: [],
    revenueByMonth: [],
    avgOrderValue: 0,
    totalCustomers: 0,
    totalRestaurants: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch user roles
      const { data: rolesData } = await supabase.from("user_roles").select("role");
      const roleCount: Record<string, number> = { customer: 0, restaurant: 0, admin: 0 };
      rolesData?.forEach((r) => {
        roleCount[r.role] = (roleCount[r.role] || 0) + 1;
      });

      const usersByRole = [
        { name: "Customers", value: roleCount.customer, color: "hsl(var(--primary))" },
        { name: "Restaurants", value: roleCount.restaurant, color: "hsl(var(--gold))" },
        { name: "Admins", value: roleCount.admin, color: "hsl(var(--accent))" },
      ];

      // Fetch profiles with created_at for signup trends
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("created_at, user_id");

      const { data: rolesWithUser } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const roleMap: Record<string, string> = {};
      rolesWithUser?.forEach((r) => {
        roleMap[r.user_id] = r.role;
      });

      // Group signups by month
      const signupsByMonth: Record<string, { customers: number; restaurants: number }> = {};
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      profilesData?.forEach((profile) => {
        const date = new Date(profile.created_at);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        if (!signupsByMonth[monthKey]) {
          signupsByMonth[monthKey] = { customers: 0, restaurants: 0 };
        }
        const role = roleMap[profile.user_id] || "customer";
        if (role === "customer") {
          signupsByMonth[monthKey].customers++;
        } else if (role === "restaurant") {
          signupsByMonth[monthKey].restaurants++;
        }
      });

      const signupsTrend = Object.entries(signupsByMonth)
        .slice(-6)
        .map(([month, data]) => ({
          month: month.split(" ")[0],
          customers: data.customers,
          restaurants: data.restaurants,
        }));

      // Fetch transactions for revenue and top restaurants
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("bill_amount, final_amount, restaurant_id, created_at")
        .eq("payment_status", "completed");

      // Calculate revenue by month
      const revenueByMonth: Record<string, number> = {};
      transactionsData?.forEach((tx) => {
        const date = new Date(tx.created_at);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + Number(tx.bill_amount);
      });

      const revenueTrend = Object.entries(revenueByMonth)
        .slice(-6)
        .map(([month, revenue]) => ({
          month: month.split(" ")[0],
          revenue,
        }));

      // Calculate top restaurants
      const restaurantRevenue: Record<string, { revenue: number; transactions: number }> = {};
      transactionsData?.forEach((tx) => {
        if (tx.restaurant_id) {
          if (!restaurantRevenue[tx.restaurant_id]) {
            restaurantRevenue[tx.restaurant_id] = { revenue: 0, transactions: 0 };
          }
          restaurantRevenue[tx.restaurant_id].revenue += Number(tx.bill_amount);
          restaurantRevenue[tx.restaurant_id].transactions++;
        }
      });

      // Get restaurant names
      const restaurantIds = Object.keys(restaurantRevenue);
      const { data: restaurantsData } = await supabase
        .from("restaurants")
        .select("id, name")
        .in("id", restaurantIds);

      const restaurantNameMap: Record<string, string> = {};
      restaurantsData?.forEach((r) => {
        restaurantNameMap[r.id] = r.name;
      });

      const topRestaurants = Object.entries(restaurantRevenue)
        .map(([id, data]) => ({
          name: restaurantNameMap[id] || "Unknown",
          revenue: data.revenue,
          transactions: data.transactions,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate average order value
      const totalRevenue = transactionsData?.reduce((sum, tx) => sum + Number(tx.bill_amount), 0) || 0;
      const avgOrderValue = transactionsData?.length ? totalRevenue / transactionsData.length : 0;

      setAnalytics({
        usersByRole,
        signupsByMonth: signupsTrend,
        topRestaurants,
        revenueByMonth: revenueTrend,
        avgOrderValue,
        totalCustomers: roleCount.customer,
        totalRestaurants: roleCount.restaurant,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6 h-64 bg-muted/50" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Customers</p>
            <p className="text-2xl font-bold text-primary">{analytics.totalCustomers}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gold/10 to-gold/5 border-gold/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Restaurants</p>
            <p className="text-2xl font-bold text-gold">{analytics.totalRestaurants}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg Order Value</p>
            <p className="text-2xl font-bold text-success">₹{Math.round(analytics.avgOrderValue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Top Restaurant Revenue</p>
            <p className="text-2xl font-bold text-accent">
              ₹{analytics.topRestaurants[0]?.revenue?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role Pie Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Users by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.usersByRole}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {analytics.usersByRole.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Signups Trend */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">User Signups Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.signupsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="customers" name="Customers" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="restaurants" name="Restaurants" fill="hsl(var(--gold))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={analytics.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--success))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--success))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performing Restaurants */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Restaurants</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.topRestaurants} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  width={100}
                  tickFormatter={(v) => (v.length > 12 ? `${v.substring(0, 12)}...` : v)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalyticsCharts;

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
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, Users, Store, IndianRupee, ShoppingCart, Award, Target, Percent } from "lucide-react";

interface AnalyticsData {
  usersByRole: { name: string; value: number; color: string }[];
  signupsByMonth: { month: string; customers: number; restaurants: number }[];
  topRestaurants: { name: string; revenue: number; transactions: number; avgOrder: number }[];
  revenueByMonth: { month: string; revenue: number; transactions: number }[];
  avgOrderValue: number;
  totalCustomers: number;
  totalRestaurants: number;
  totalRevenue: number;
  totalTransactions: number;
  totalDiscountGiven: number;
  cuisineDistribution: { name: string; value: number }[];
  transactionsByDay: { day: string; count: number; revenue: number }[];
  conversionRate: number;
  activeRestaurants: number;
  recentSignups: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--gold))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--destructive))"];

const AdminAnalyticsCharts = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    usersByRole: [],
    signupsByMonth: [],
    topRestaurants: [],
    revenueByMonth: [],
    avgOrderValue: 0,
    totalCustomers: 0,
    totalRestaurants: 0,
    totalRevenue: 0,
    totalTransactions: 0,
    totalDiscountGiven: 0,
    cuisineDistribution: [],
    transactionsByDay: [],
    conversionRate: 0,
    activeRestaurants: 0,
    recentSignups: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch user roles
      const { data: rolesData } = await supabase.from("user_roles").select("role, created_at");
      const roleCount: Record<string, number> = { customer: 0, restaurant: 0, admin: 0 };
      let recentSignups = 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      rolesData?.forEach((r) => {
        roleCount[r.role] = (roleCount[r.role] || 0) + 1;
        if (new Date(r.created_at) >= thirtyDaysAgo) {
          recentSignups++;
        }
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

      // Fetch all transactions
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("bill_amount, final_amount, discount_amount, restaurant_id, created_at, payment_status, user_id")
        .eq("payment_status", "completed");

      // Calculate revenue by month with transaction count
      const revenueByMonth: Record<string, { revenue: number; transactions: number }> = {};
      transactionsData?.forEach((tx) => {
        const date = new Date(tx.created_at);
        const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
        if (!revenueByMonth[monthKey]) {
          revenueByMonth[monthKey] = { revenue: 0, transactions: 0 };
        }
        revenueByMonth[monthKey].revenue += Number(tx.bill_amount);
        revenueByMonth[monthKey].transactions++;
      });

      const revenueTrend = Object.entries(revenueByMonth)
        .slice(-6)
        .map(([month, data]) => ({
          month: month.split(" ")[0],
          revenue: data.revenue,
          transactions: data.transactions,
        }));

      // Calculate transactions by day of week
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const transactionsByDay: Record<string, { count: number; revenue: number }> = {};
      dayNames.forEach(day => {
        transactionsByDay[day] = { count: 0, revenue: 0 };
      });
      
      transactionsData?.forEach((tx) => {
        const date = new Date(tx.created_at);
        const dayName = dayNames[date.getDay()];
        transactionsByDay[dayName].count++;
        transactionsByDay[dayName].revenue += Number(tx.bill_amount);
      });

      const transactionsByDayArray = dayNames.map(day => ({
        day,
        count: transactionsByDay[day].count,
        revenue: transactionsByDay[day].revenue,
      }));

      // Calculate top restaurants with more metrics
      const restaurantStats: Record<string, { revenue: number; transactions: number; customers: Set<string> }> = {};
      transactionsData?.forEach((tx) => {
        if (tx.restaurant_id) {
          if (!restaurantStats[tx.restaurant_id]) {
            restaurantStats[tx.restaurant_id] = { revenue: 0, transactions: 0, customers: new Set() };
          }
          restaurantStats[tx.restaurant_id].revenue += Number(tx.bill_amount);
          restaurantStats[tx.restaurant_id].transactions++;
          if (tx.user_id) {
            restaurantStats[tx.restaurant_id].customers.add(tx.user_id);
          }
        }
      });

      // Get restaurant names and cuisine
      const restaurantIds = Object.keys(restaurantStats);
      const { data: restaurantsData } = await supabase
        .from("restaurants")
        .select("id, name, cuisine, is_active")
        .in("id", restaurantIds.length > 0 ? restaurantIds : ['no-id']);

      const restaurantNameMap: Record<string, string> = {};
      const cuisineCount: Record<string, number> = {};
      let activeRestaurants = 0;
      
      restaurantsData?.forEach((r) => {
        restaurantNameMap[r.id] = r.name;
        cuisineCount[r.cuisine] = (cuisineCount[r.cuisine] || 0) + 1;
        if (r.is_active) activeRestaurants++;
      });

      // Get all restaurants for cuisine distribution
      const { data: allRestaurants } = await supabase
        .from("restaurants")
        .select("cuisine, is_active");
      
      const allCuisineCount: Record<string, number> = {};
      allRestaurants?.forEach((r) => {
        allCuisineCount[r.cuisine] = (allCuisineCount[r.cuisine] || 0) + 1;
        if (r.is_active) activeRestaurants++;
      });

      const cuisineDistribution = Object.entries(allCuisineCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const topRestaurants = Object.entries(restaurantStats)
        .map(([id, data]) => ({
          name: restaurantNameMap[id] || "Unknown",
          revenue: data.revenue,
          transactions: data.transactions,
          avgOrder: data.transactions > 0 ? data.revenue / data.transactions : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate totals
      const totalRevenue = transactionsData?.reduce((sum, tx) => sum + Number(tx.bill_amount), 0) || 0;
      const totalDiscountGiven = transactionsData?.reduce((sum, tx) => sum + Number(tx.discount_amount || 0), 0) || 0;
      const avgOrderValue = transactionsData?.length ? totalRevenue / transactionsData.length : 0;
      const totalTransactions = transactionsData?.length || 0;

      // Calculate conversion rate (users who made at least one transaction / total customers)
      const usersWithTransactions = new Set(transactionsData?.map(tx => tx.user_id).filter(Boolean));
      const conversionRate = roleCount.customer > 0 ? (usersWithTransactions.size / roleCount.customer) * 100 : 0;

      setAnalytics({
        usersByRole,
        signupsByMonth: signupsTrend,
        topRestaurants,
        revenueByMonth: revenueTrend,
        avgOrderValue,
        totalCustomers: roleCount.customer,
        totalRestaurants: roleCount.restaurant,
        totalRevenue,
        totalTransactions,
        totalDiscountGiven,
        cuisineDistribution,
        transactionsByDay: transactionsByDayArray,
        conversionRate,
        activeRestaurants,
        recentSignups,
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
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6 h-64 bg-muted/50" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Total Customers</p>
            </div>
            <p className="text-2xl font-bold text-primary">{analytics.totalCustomers}</p>
            <p className="text-xs text-muted-foreground mt-1">+{analytics.recentSignups} this month</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gold/10 to-gold/5 border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Store className="w-4 h-4 text-gold" />
              <p className="text-xs text-muted-foreground">Total Restaurants</p>
            </div>
            <p className="text-2xl font-bold text-gold">{analytics.totalRestaurants}</p>
            <p className="text-xs text-muted-foreground mt-1">{analytics.activeRestaurants} active</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee className="w-4 h-4 text-success" />
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </div>
            <p className="text-2xl font-bold text-success">₹{analytics.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{analytics.totalTransactions} transactions</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-4 h-4 text-accent" />
              <p className="text-xs text-muted-foreground">Avg Order Value</p>
            </div>
            <p className="text-2xl font-bold text-accent">₹{Math.round(analytics.avgOrderValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4 text-destructive" />
              <p className="text-xs text-muted-foreground">Total Discounts Given</p>
            </div>
            <p className="text-xl font-bold text-destructive">₹{analytics.totalDiscountGiven.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Conversion Rate</p>
            </div>
            <p className="text-xl font-bold text-primary">{analytics.conversionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-gold" />
              <p className="text-xs text-muted-foreground">Top Restaurant Revenue</p>
            </div>
            <p className="text-xl font-bold text-gold">₹{analytics.topRestaurants[0]?.revenue?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <p className="text-xs text-muted-foreground">Avg Restaurant AOV</p>
            </div>
            <p className="text-xl font-bold text-success">
              ₹{Math.round(analytics.topRestaurants.reduce((sum, r) => sum + r.avgOrder, 0) / (analytics.topRestaurants.length || 1))}
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

        {/* Cuisine Distribution */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Restaurant Cuisine Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.cuisineDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {analytics.cuisineDistribution.map((entry, index) => (
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

        {/* Transactions by Day of Week */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Transactions by Day of Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.transactionsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "revenue" ? `₹${value.toLocaleString()}` : value,
                    name === "revenue" ? "Revenue" : "Transactions"
                  ]}
                />
                <Legend />
                <Bar dataKey="count" name="Transactions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend with Area */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Revenue & Transaction Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={analytics.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "Revenue" ? `₹${value.toLocaleString()}` : value,
                    name
                  ]}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="hsl(var(--success))"
                  fill="hsl(var(--success) / 0.2)"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="transactions"
                  name="Transactions"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                />
              </AreaChart>
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
                  formatter={(value: number, name: string) => [
                    name === "revenue" ? `₹${value.toLocaleString()}` : name === "avgOrder" ? `₹${Math.round(value)}` : value,
                    name === "revenue" ? "Revenue" : name === "avgOrder" ? "Avg Order" : "Transactions"
                  ]}
                />
                <Bar dataKey="revenue" name="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Restaurants Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Top Restaurant Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rank</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Restaurant</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Revenue</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Transactions</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Avg Order</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topRestaurants.map((restaurant, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-gold/20 text-gold' : 
                        index === 1 ? 'bg-muted text-muted-foreground' : 
                        index === 2 ? 'bg-orange-500/20 text-orange-500' : 'bg-muted/50 text-muted-foreground'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{restaurant.name}</td>
                    <td className="py-3 px-4 text-right text-success">₹{restaurant.revenue.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">{restaurant.transactions}</td>
                    <td className="py-3 px-4 text-right text-primary">₹{Math.round(restaurant.avgOrder)}</td>
                  </tr>
                ))}
                {analytics.topRestaurants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">No transaction data available yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalyticsCharts;

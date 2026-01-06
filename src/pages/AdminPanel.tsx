import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Shield, Users, Store, Receipt, TrendingUp, Check, X, Eye, ArrowLeft,
  DollarSign, Percent, BarChart3, Bell, UserPlus, Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";
import AdminAnalyticsCharts from "@/components/AdminAnalyticsCharts";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import AdminCreator from "@/components/AdminCreator";
import CouponManager from "@/components/CouponManager";

interface RestaurantStats {
  totalRevenue: number;
  totalTransactions: number;
  totalCustomers: number;
  avgOrderValue: number;
  activeOffers: number;
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  role?: string;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, role, signOut, loading } = useAuth();
  const { toast } = useToast();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({ users: 0, restaurants: 0, transactions: 0, revenue: 0 });
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "restaurants" | "users" | "admins" | "coupons">("overview");
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);
  const [restaurantStats, setRestaurantStats] = useState<RestaurantStats | null>(null);
  const [restaurantOffers, setRestaurantOffers] = useState<any[]>([]);
  const [restaurantTransactions, setRestaurantTransactions] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // Enable order notifications for admin
  const { requestPermission } = useOrderNotifications({
    isAdmin: true,
    enabled: user && role === "admin",
    onNewOrder: (order) => {
      setRecentOrders(prev => [order, ...prev].slice(0, 10));
      // Refresh stats when new order comes in
      fetchData();
    },
  });

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      navigate("/admin/login");
      return;
    }
    if (user && role === "admin") {
      fetchData();
    }
  }, [user, role, loading]);

  const fetchData = async () => {
    const { data: restaurantsData } = await supabase.from("restaurants").select("*").order("created_at", { ascending: false });
    setRestaurants(restaurantsData || []);

    const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    const { count: restCount } = await supabase.from("restaurants").select("*", { count: "exact", head: true });
    const { data: txData } = await supabase.from("transactions").select("final_amount").eq("payment_status", "completed");
    
    const revenue = txData?.reduce((sum, t) => sum + Number(t.final_amount), 0) || 0;
    setStats({ users: userCount || 0, restaurants: restCount || 0, transactions: txData?.length || 0, revenue });
  };

  const fetchUsers = async () => {
    const { data: profilesData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    
    // Get roles for all users
    const userIds = (profilesData || []).map(p => p.user_id);
    const { data: rolesData } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);
    
    const rolesMap: Record<string, string> = {};
    rolesData?.forEach(r => {
      rolesMap[r.user_id] = r.role;
    });
    
    const usersWithRoles = (profilesData || []).map(p => ({
      ...p,
      role: rolesMap[p.user_id] || "customer",
    }));
    
    setUsers(usersWithRoles);
  };

  const fetchRestaurantDetails = async (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    
    // Fetch transactions for this restaurant
    const { data: txData } = await supabase
      .from("transactions")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .eq("payment_status", "completed")
      .order("created_at", { ascending: false });
    
    setRestaurantTransactions(txData || []);
    
    // Fetch offers
    const { data: offersData } = await supabase
      .from("offers")
      .select("*")
      .eq("restaurant_id", restaurant.id);
    
    setRestaurantOffers(offersData || []);
    
    // Calculate stats
    const uniqueCustomers = new Set((txData || []).map(t => t.user_id)).size;
    const totalRevenue = (txData || []).reduce((sum, t) => sum + Number(t.bill_amount), 0);
    const activeOffers = (offersData || []).filter(o => o.is_active).length;
    
    setRestaurantStats({
      totalRevenue,
      totalTransactions: txData?.length || 0,
      totalCustomers: uniqueCustomers,
      avgOrderValue: txData?.length ? totalRevenue / txData.length : 0,
      activeOffers,
    });
  };

  const approveRestaurant = async (id: string, approved: boolean) => {
    await supabase.from("restaurants").update({ is_approved: approved, is_active: approved }).eq("id", id);
    setRestaurants(restaurants.map(r => r.id === id ? { ...r, is_approved: approved, is_active: approved } : r));
    toast({ title: approved ? "Restaurant Approved" : "Restaurant Rejected" });
  };

  useEffect(() => {
    if (activeTab === "users" && users.length === 0) {
      fetchUsers();
    }
  }, [activeTab]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;

  // Restaurant Detail View
  if (selectedRestaurant) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 glass border-b border-border/30">
          <div className="container py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedRestaurant(null)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <span className="font-medium">{selectedRestaurant.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${selectedRestaurant.is_approved ? "bg-success/10 text-success" : "bg-gold/10 text-gold"}`}>
                {selectedRestaurant.is_approved ? "Approved" : "Pending"}
              </span>
            </div>
          </div>
        </header>

        <div className="container py-6 space-y-6">
          {/* Restaurant Info */}
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {selectedRestaurant.image_url && (
                  <img src={selectedRestaurant.image_url} alt={selectedRestaurant.name} className="w-24 h-24 rounded-xl object-cover" />
                )}
                <div className="flex-1">
                  <h2 className="font-display text-xl font-bold">{selectedRestaurant.name}</h2>
                  <p className="text-muted-foreground">{selectedRestaurant.cuisine} • {selectedRestaurant.city}</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedRestaurant.address}</p>
                  <div className="flex gap-4 mt-3 text-sm">
                    <span className="text-muted-foreground">📞 {selectedRestaurant.phone || "N/A"}</span>
                    <span className="text-muted-foreground">✉️ {selectedRestaurant.email || "N/A"}</span>
                  </div>
                  <div className="mt-3 p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">UPI ID</p>
                    <p className="font-mono text-sm">{selectedRestaurant.upi_id || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          {restaurantStats && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Card><CardContent className="p-4">
                <DollarSign className="w-6 h-6 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold">₹{restaurantStats.totalRevenue.toLocaleString()}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <Receipt className="w-6 h-6 text-gold mb-2" />
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="text-xl font-bold">{restaurantStats.totalTransactions}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <Users className="w-6 h-6 text-success mb-2" />
                <p className="text-xs text-muted-foreground">Customers</p>
                <p className="text-xl font-bold">{restaurantStats.totalCustomers}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <TrendingUp className="w-6 h-6 text-accent mb-2" />
                <p className="text-xs text-muted-foreground">Avg Order</p>
                <p className="text-xl font-bold">₹{Math.round(restaurantStats.avgOrderValue)}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <Percent className="w-6 h-6 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Active Offers</p>
                <p className="text-xl font-bold">{restaurantStats.activeOffers}</p>
              </CardContent></Card>
            </div>
          )}

          {/* Active Offers */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Active Offers</CardTitle>
            </CardHeader>
            <CardContent>
              {restaurantOffers.length > 0 ? (
                <div className="space-y-3">
                  {restaurantOffers.map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary">
                      <div>
                        <p className="font-medium">{offer.title}</p>
                        <p className="text-sm text-muted-foreground">Max ₹{offer.max_discount} off</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold gradient-text">{offer.discount_percent}%</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${offer.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                          {offer.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No offers created yet</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {restaurantTransactions.length > 0 ? (
                <div className="space-y-3">
                  {restaurantTransactions.slice(0, 10).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary">
                      <div>
                        <p className="font-medium">₹{tx.bill_amount}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${tx.payment_status === "completed" ? "bg-success/10 text-success" : "bg-gold/10 text-gold"}`}>
                          {tx.payment_status}
                        </span>
                        <p className="text-sm text-success mt-1">-₹{tx.discount_amount} discount</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No transactions yet</p>
              )}
            </CardContent>
          </Card>

          {/* Approval Actions */}
          {!selectedRestaurant.is_approved && (
            <Card className="border-gold/30 bg-gold/5">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Restaurant Approval</h3>
                <div className="flex gap-4">
                  <Button variant="gradient" onClick={() => { approveRestaurant(selectedRestaurant.id, true); setSelectedRestaurant({ ...selectedRestaurant, is_approved: true }); }}>
                    <Check className="w-4 h-4 mr-2" />
                    Approve Restaurant
                  </Button>
                  <Button variant="outline" onClick={() => { approveRestaurant(selectedRestaurant.id, false); setSelectedRestaurant(null); }}>
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-foreground" />
              <span className="font-medium">Admin Panel</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>Sign Out</Button>
        </div>
      </header>

      <div className="container py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Overview", icon: null },
            { id: "analytics", label: "Analytics", icon: BarChart3 },
            { id: "restaurants", label: "Restaurants", icon: Store },
            { id: "users", label: "Users", icon: Users },
            { id: "admins", label: "Create Admin", icon: UserPlus },
            { id: "coupons", label: "Coupons", icon: Ticket },
          ].map(tab => (
            <Button key={tab.id} variant={activeTab === tab.id ? "default" : "secondary"} size="sm" onClick={() => setActiveTab(tab.id as any)} className="flex items-center gap-1 shrink-0">
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
            </Button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><Users className="w-8 h-8 text-primary mb-2" /><p className="text-xs text-muted-foreground">Total Users</p><p className="text-2xl font-bold">{stats.users}</p></CardContent></Card>
            <Card><CardContent className="p-4"><Store className="w-8 h-8 text-gold mb-2" /><p className="text-xs text-muted-foreground">Restaurants</p><p className="text-2xl font-bold">{stats.restaurants}</p></CardContent></Card>
            <Card><CardContent className="p-4"><Receipt className="w-8 h-8 text-success mb-2" /><p className="text-xs text-muted-foreground">Transactions</p><p className="text-2xl font-bold">{stats.transactions}</p></CardContent></Card>
            <Card><CardContent className="p-4"><TrendingUp className="w-8 h-8 text-accent mb-2" /><p className="text-xs text-muted-foreground">Revenue</p><p className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</p></CardContent></Card>
          </div>
        )}

        {activeTab === "analytics" && (
          <AdminAnalyticsCharts />
        )}

        {activeTab === "restaurants" && (
          <div className="space-y-4">
            <h2 className="font-bold text-lg">Restaurant Management</h2>
            {restaurants.map(r => (
              <Card key={r.id} className="border-border/50 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fetchRestaurantDetails(r)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {r.image_url && (
                      <img src={r.image_url} alt={r.name} className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-sm text-muted-foreground">{r.cuisine} • {r.city}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_approved ? "bg-success/10 text-success" : "bg-gold/10 text-gold"}`}>
                          {r.is_approved ? "Approved" : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); fetchRestaurantDetails(r); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Switch 
                      checked={r.is_active} 
                      onCheckedChange={(v) => { approveRestaurant(r.id, v); }} 
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
            {restaurants.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Store className="w-12 h-12 mx-auto mb-2" />
                <p>No restaurants registered yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-4">
            <h2 className="font-bold text-lg">User Management</h2>
            {users.map(u => (
              <Card key={u.id} className="border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                      {u.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-semibold">{u.full_name || "Unnamed User"}</p>
                      <p className="text-sm text-muted-foreground">{u.phone || "No phone"}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    u.role === "admin" ? "bg-primary/10 text-primary" : 
                    u.role === "restaurant" ? "bg-gold/10 text-gold" : 
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {u.role}
                  </span>
                </CardContent>
              </Card>
            ))}
            {users.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2" />
                <p>Loading users...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "admins" && (
          <AdminCreator />
        )}

        {activeTab === "coupons" && (
          <CouponManager />
        )}
      </div>
    </div>
  );
};

export default AdminPanel;

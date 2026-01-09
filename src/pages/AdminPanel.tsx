import { hasAccess } from "@/utils/roleAccess";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Users,
  Store,
  Receipt,
  TrendingUp,
  LogOut,
  MapPin,
  Calendar,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";
import AdminAnalyticsCharts from "@/components/AdminAnalyticsCharts";
import AdminCreator from "@/components/AdminCreator";
import CouponManager from "@/components/CouponManager";
import { AdminAuditLog } from "@/components/AdminAuditLog";
import { useAuditLog } from "@/hooks/useAuditLog";

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
  // Updated destructuring based on your request
  const { user, role, signOut, loading } = useAuth(); 
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({
    users: 0,
    restaurants: 0,
    transactions: 0,
    revenue: 0,
  });
  
  const [activeTab, setActiveTab] = useState<
    "overview" | "analytics" | "restaurants" | "users" | "admins" | "coupons" | "audit"
  >("overview");

  const isAdmin = role === "admin" || role === "super_admin";
  const isSuperAdmin = role === "super_admin";

  /* ---------------- ADMIN GUARD ---------------- */
  useEffect(() => {
    // 1. Wait for auth loading AND role fetching to finish
    if (loading) return;
    // No user → kick out
    if (!user) {
      navigate("/admin/login", { replace: true });
      return;
    }
    if (role === null) return;
    // 2. Check permissions
    if (!hasAccess(role, "admin")) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view this page.",
        variant: "destructive",
      });
      navigate("/admin/login", { replace: true });
    }
  }, [user, role, loading, navigate, toast]);

  /* ---------------- DATA FETCHING ---------------- */
  const fetchData = async () => {
    try {
      // Fetch Restaurants
      const { data: restaurantsData } = await supabase
        .from("restaurants")
        .select("*")
        .order("created_at", { ascending: false });
      setRestaurants(restaurantsData || []);

      // Fetch Profiles (Users)
      const { data: profilesData, count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact" });
      setUsers((profilesData as UserProfile[]) || []);

      // Fetch Counts for Stats
      const { count: restCount } = await supabase
        .from("restaurants")
        .select("*", { count: "exact", head: true });

      // Fetch Revenue
      const { data: txData } = await supabase
        .from("transactions")
        .select("final_amount")
        .eq("payment_status", "completed");

      const revenue = txData?.reduce((sum, t) => sum + Number(t.final_amount), 0) || 0;

      setStats({
        users: userCount || 0,
        restaurants: restCount || 0,
        transactions: txData?.length || 0,
        revenue,
      });
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  useEffect(() => {
    if (user && isAdmin && !loading) {
      fetchData();
    }
  }, [user, role, loading, isAdmin]);

  /* ---------------- LOADING STATE ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Verifying admin privileges...</p>
        </div>
      </div>
    );
  }

  // Prevent flash of content if redirected
  if (!user || !isAdmin) return null;

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-medium">Admin Panel</span>
              {isSuperAdmin && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Super Admin
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container py-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "overview", label: "Overview" },
            { id: "analytics", label: "Analytics" },
            { id: "restaurants", label: "Restaurants" },
            { id: "users", label: "Users" },
            isSuperAdmin && { id: "admins", label: "Create Admin" },
            { id: "coupons", label: "Coupons" },
            { id: "audit", label: "Audit Log" },
          ]
            .filter(Boolean)
            .map((tab: any) => (
              <Button
                key={tab.id}
                size="sm"
                variant={activeTab === tab.id ? "default" : "outline"}
                onClick={() => setActiveTab(tab.id)}
                className="whitespace-nowrap"
              >
                {tab.label}
              </Button>
            ))}
        </div>

        {/* --- TAB CONTENT --- */}

        {/* 1. OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold mt-2">{stats.users}</p>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Restaurants</p>
                    <p className="text-2xl font-bold mt-2">{stats.restaurants}</p>
                  </div>
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Store className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold mt-2">{stats.transactions}</p>
                  </div>
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Receipt className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold mt-2">₹{stats.revenue.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 2. ANALYTICS */}
        {activeTab === "analytics" && <AdminAnalyticsCharts />}

        {/* 3. RESTAURANTS */}
        {activeTab === "restaurants" && (
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {restaurants.length === 0 ? (
               <p className="text-muted-foreground col-span-full">No restaurants found.</p>
             ) : (
               restaurants.map((rest) => (
                 <Card key={rest.id} className="hover:shadow-md transition-shadow">
                   <CardHeader className="pb-2">
                     <CardTitle className="text-lg flex justify-between">
                       {rest.name}
                       <span className={`text-xs px-2 py-1 rounded-full ${rest.is_open ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                         {rest.is_open ? 'Open' : 'Closed'}
                       </span>
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="text-sm text-muted-foreground space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{rest.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{rest.phone || "N/A"}</span>
                      </div>
                   </CardContent>
                 </Card>
               ))
             )}
           </div>
        )}

        {/* 4. USERS */}
        {activeTab === "users" && (
           <Card>
             <CardHeader>
               <CardTitle>Registered Users</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 {users.map((u) => (
                   <div key={u.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                     <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                         <Users className="w-5 h-5 text-muted-foreground" />
                       </div>
                       <div>
                         <p className="font-medium">{u.full_name || "Unnamed User"}</p>
                         <p className="text-sm text-muted-foreground">{u.phone || "No phone"}</p>
                       </div>
                     </div>
                     <div className="text-right text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(u.created_at).toLocaleDateString()}
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
        )}

        {/* 5. CREATE ADMIN (Super Admin Only) */}
        {activeTab === "admins" && hasAccess(role, "super_admin") && (
           <AdminCreator />
         )}


        {/* 6. COUPONS */}
        {activeTab === "coupons" && <CouponManager />}

        {/* 7. AUDIT LOG */}
        {activeTab === "audit" && <AdminAuditLog />}
      </div>
    </div>
  );
};

export default AdminPanel;

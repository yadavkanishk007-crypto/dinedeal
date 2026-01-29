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
  Phone,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Wallet,
  PiggyBank,
  CreditCard,
  Headphones,
  Sparkles,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";
import AdminAnalyticsCharts from "@/components/AdminAnalyticsCharts";
import AdminCreator from "@/components/AdminCreator";
import CouponManager from "@/components/CouponManager";
import { AdminAuditLog } from "@/components/AdminAuditLog";
import { useAuditLog } from "@/hooks/useAuditLog";
import AdminNotificationSender from "@/components/AdminNotificationSender";
import AdminRestaurantDetail from "@/components/AdminRestaurantDetail";
import AdminRestaurantEarnings from "@/components/AdminRestaurantEarnings";
import AdminSettlements from "@/components/AdminSettlements";
import AdminPayouts from "@/components/AdminPayouts";
import AdminSupport from "@/components/AdminSupport"; 
import { cn } from "@/lib/utils";

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
  const { logAction } = useAuditLog();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({
    users: 0,
    restaurants: 0,
    pendingApprovals: 0,
    transactions: 0,
    revenue: 0,
  });

  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "analytics"
    | "restaurants"
    | "users"
    | "admins"
    | "notifications"
    | "coupons"
    | "audit"
    | "earnings"
    | "settlements"
    | "support"
    | "payouts"
  >("overview");
  
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  /* --- SEARCH & FILTER STATE --- */
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const isAdmin = role === "admin" || role === "super_admin";
  const isSuperAdmin = role === "super_admin";

  /* ---------------- ADMIN GUARD ---------------- */
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/admin/login", { replace: true });
      return;
    }
    if (role === null) return;
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
      const { data: restaurantsData } = await supabase
        .from("restaurants")
        .select("*")
        .order("created_at", { ascending: false });
      setRestaurants(restaurantsData || []);

      const { data: profilesData, count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact" });
      setUsers((profilesData as UserProfile[]) || []);

      const { count: restCount } = await supabase
        .from("restaurants")
        .select("*", { count: "exact", head: true });

      const { count: pendingCount } = await supabase
        .from("restaurants")
        .select("*", { count: "exact", head: true })
        .eq("is_approved", false);

      const { data: txData } = await supabase
        .from("transactions")
        .select("final_amount")
        .eq("payment_status", "completed");

      const revenue = txData?.reduce((sum, t) => sum + Number(t.final_amount), 0) || 0;

      setStats({
        users: userCount || 0,
        restaurants: restCount || 0,
        pendingApprovals: pendingCount || 0,
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

  /* --- FILTER LOGIC --- */
  const filteredRestaurants = restaurants.filter((rest) => {
    const matchesSearch = rest.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = 
      filterStatus === "all" ? true :
      filterStatus === "pending" ? !rest.is_approved :
      filterStatus === "approved" ? rest.is_approved :
      filterStatus === "rejected" ? (rest.is_approved === false && rest.is_active === false) : // Logic for rejection
      true;
    
    return matchesSearch && matchesStatus;
  });

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

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
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
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "overview", label: "Overview" },
            { id: "analytics", label: "Analytics" },
            { id: "restaurants", label: "Restaurants" },
            { id: "earnings", label: "Earnings", icon: PiggyBank },
            { id: "settlements", label: "Settlements", icon: Wallet },
            { id: "payouts", label: "Payouts", icon: CreditCard },
            { id: "users", label: "Users" },
            isSuperAdmin && { id: "admins", label: "Create Admin" },
            { id: "support", label: "Support", icon: Headphones },
            { id: "notifications", label: "Notifications", icon: Bell },
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
                className="whitespace-nowrap gap-2"
              >
                {tab.icon && <tab.icon className="w-4 h-4" />}
                {tab.label}
              </Button>
            ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-4">
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
                    <p className="text-sm font-medium text-muted-foreground">Business Entities</p>
                    <p className="text-2xl font-bold mt-2">{stats.restaurants}</p>
                  </div>
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Store className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab("restaurants")}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                    <p className="text-2xl font-bold mt-2">{stats.pendingApprovals}</p>
                  </div>
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-500" />
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

        {activeTab === "analytics" && <AdminAnalyticsCharts />}

        {activeTab === "restaurants" && (
          selectedRestaurantId ? (
            <AdminRestaurantDetail
              restaurantId={selectedRestaurantId}
              onBack={() => setSelectedRestaurantId(null)}
              onApprovalChange={fetchData}
            />
          ) : (
            <div className="space-y-6">
              {/* --- SEARCH & CATEGORY FILTER BAR --- */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-secondary/10 p-4 rounded-2xl border border-border">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name..." 
                    className="pl-10" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-1 bg-background p-1 rounded-xl border">
                  {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                    <Button
                      key={status}
                      variant={filterStatus === status ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setFilterStatus(status)}
                      className="capitalize h-8"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRestaurants.length === 0 ? (
                  <p className="text-muted-foreground col-span-full py-12 text-center">No businesses match your search or filter.</p>
                ) : (
                  filteredRestaurants.map((rest) => (
                    <Card 
                      key={rest.id} 
                      className={cn(
                        "hover:shadow-md transition-shadow cursor-pointer group border-l-4",
                        rest.is_event_organiser ? "border-l-purple-500" : "border-l-orange-500"
                      )}
                      onClick={() => setSelectedRestaurantId(rest.id)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex justify-between items-start">
                          <span className="truncate pr-2">{rest.name}</span>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">
                               {rest.is_event_organiser ? 'Event Group' : 'Restaurant'}
                            </Badge>
                            {!rest.is_approved ? (
                              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            ) : rest.is_active ? (
                              <Badge variant="default" className="bg-green-500 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <XCircle className="w-3 h-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground space-y-2">
                        <div className="flex items-center gap-2">
                          {rest.is_event_organiser ? <Sparkles className="w-4 h-4 text-purple-500" /> : <Store className="w-4 h-4 text-orange-500" />}
                          <span className="truncate">{rest.is_event_organiser ? "Organiser" : rest.cuisine}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{rest.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{rest.phone || "N/A"}</span>
                        </div>
                        <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="outline" size="sm" className="w-full gap-2">
                            <Eye className="w-4 h-4" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )
        )}

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

        {activeTab === "admins" && hasAccess(role, "super_admin") && (
           <AdminCreator />
         )}

        {activeTab === "notifications" && <AdminNotificationSender />}

        {activeTab === "coupons" && <CouponManager />}

        {activeTab === "audit" && <AdminAuditLog />}

        {activeTab === "earnings" && <AdminRestaurantEarnings />}

        {activeTab === "settlements" && <AdminSettlements />}

        {activeTab === "payouts" && <AdminPayouts />}

        {activeTab === "support" && <AdminSupport />}
      </div>
    </div>
  );
};

export default AdminPanel;

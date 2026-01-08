import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Store,
  Receipt,
  TrendingUp,
  Check,
  X,
  Eye,
  ArrowLeft,
  DollarSign,
  Percent,
  BarChart3,
  UserPlus,
  Ticket,
  FileText,
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
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);
  const [restaurantStats, setRestaurantStats] = useState<RestaurantStats | null>(null);
  const [restaurantOffers, setRestaurantOffers] = useState<any[]>([]);
  const [restaurantTransactions, setRestaurantTransactions] = useState<any[]>([]);

  const isAdmin = role === "admin" || role === "super_admin";
  const isSuperAdmin = role === "super_admin";

  /* ---------------- ADMIN GUARD (FIXED) ---------------- */
  useEffect(() => {
    if (!loading && (!user || !["admin", "super_admin"].includes(role ?? ""))) {
      navigate("/admin/login", { replace: true });
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  /* ---------------- DATA ---------------- */

  const fetchData = async () => {
    const { data: restaurantsData } = await supabase
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false });

    setRestaurants(restaurantsData || []);

    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: restCount } = await supabase
      .from("restaurants")
      .select("*", { count: "exact", head: true });

    const { data: txData } = await supabase
      .from("transactions")
      .select("final_amount")
      .eq("payment_status", "completed");

    const revenue =
      txData?.reduce((sum, t) => sum + Number(t.final_amount), 0) || 0;

    setStats({
      users: userCount || 0,
      restaurants: restCount || 0,
      transactions: txData?.length || 0,
      revenue,
    });
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, role]);

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="font-medium">Admin Panel</span>
              {isSuperAdmin && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Super Admin
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto">
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
                variant={activeTab === tab.id ? "default" : "secondary"}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <Users className="w-6 h-6 mb-2" />
                <p className="text-xs text-muted-foreground">Users</p>
                <p className="text-xl font-bold">{stats.users}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Store className="w-6 h-6 mb-2" />
                <p className="text-xs text-muted-foreground">Restaurants</p>
                <p className="text-xl font-bold">{stats.restaurants}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Receipt className="w-6 h-6 mb-2" />
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="text-xl font-bold">{stats.transactions}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <TrendingUp className="w-6 h-6 mb-2" />
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold">₹{stats.revenue}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "analytics" && <AdminAnalyticsCharts />}
        {activeTab === "admins" && isSuperAdmin && <AdminCreator />}
        {activeTab === "coupons" && <CouponManager />}
        {activeTab === "audit" && <AdminAuditLog />}
      </div>
    </div>
  );
};

export default AdminPanel;

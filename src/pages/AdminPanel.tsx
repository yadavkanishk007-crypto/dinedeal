import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Shield, Users, Store, Receipt, TrendingUp, Check, X, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, role, signOut, loading } = useAuth();
  const { toast } = useToast();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [stats, setStats] = useState({ users: 0, restaurants: 0, transactions: 0, revenue: 0 });
  const [activeTab, setActiveTab] = useState<"overview" | "restaurants" | "users">("overview");

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

  const approveRestaurant = async (id: string, approved: boolean) => {
    await supabase.from("restaurants").update({ is_approved: approved, is_active: approved }).eq("id", id);
    setRestaurants(restaurants.map(r => r.id === id ? { ...r, is_approved: approved, is_active: approved } : r));
    toast({ title: approved ? "Restaurant Approved" : "Restaurant Rejected" });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;

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
        <div className="flex gap-2 mb-6">
          {["overview", "restaurants", "users"].map(tab => (
            <Button key={tab} variant={activeTab === tab ? "default" : "secondary"} size="sm" onClick={() => setActiveTab(tab as any)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
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

        {activeTab === "restaurants" && (
          <div className="space-y-4">
            <h2 className="font-bold text-lg">Restaurant Management</h2>
            {restaurants.map(r => (
              <Card key={r.id} className="border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-sm text-muted-foreground">{r.cuisine} • {r.city}</p>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_approved ? "bg-success/10 text-success" : "bg-gold/10 text-gold"}`}>
                        {r.is_approved ? "Approved" : "Pending"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!r.is_approved && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => approveRestaurant(r.id, true)}><Check className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => approveRestaurant(r.id, false)}><X className="w-4 h-4" /></Button>
                      </>
                    )}
                    <Switch checked={r.is_active} onCheckedChange={(v) => approveRestaurant(r.id, v)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "users" && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2" />
            <p>User management coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Gamepad, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Plus, 
  Settings, 
  BarChart3,
  Receipt,
  Percent,
  AlertCircle,
  Calendar,
  Wallet,
  LogOut,
  Sparkles,
  Headphones,
  PiggyBank
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";
import MenuManager from "@/components/MenuManager";
import ReservationManager from "@/components/ReservationManager";
import RestaurantEarningsTab from "@/components/RestaurantEarningsTab";
import RestaurantSettlementsTab from "@/components/RestaurantSettlementsTab";
import PostBillToCustomer from "@/components/PostBillToCustomer";
import RestaurantSupportTab from "@/components/RestaurantSupportTab";
import RestaurantSettings from "@/components/RestaurantSettings";

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  is_active: boolean;
  is_approved: boolean;
  image_url: string | null;
  phone?: string | null;
  email?: string | null;
  open_hours?: string | null;
  upi_id?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  bank_account_holder?: string | null;
  is_event_organiser?: boolean;
  organiser_type?: string | null;
  latitude?: number;
  longitude?: number;
  fssai?: string | null;
  gst?: string | null;
  provides_dine_in?: boolean | null;
}

interface Offer {
  id: string;
  title: string;
  discount_percent: number;
  max_discount: number;
  terms: string | null;
  is_active: boolean;
}

export default function ActivityDashboard() {
  const navigate = useNavigate();
  const { user, signOut, refresh } = useAuth();
  const { toast } = useToast();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "menu" | "reservations" | "dinein" | "offers" | "earnings" | "settlements" | "settings" | "support"
  >("overview");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalBookings: 0,
    activeArenas: 0,
    todaysEarnings: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch venue data
      const { data: venue, error: venueErr } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (venueErr) throw venueErr;
      if (!venue) {
        navigate("/auth");
        return;
      }

      // Auto-heal organiser_type if not set
      if (venue.organiser_type !== "activity_provider") {
        await supabase
          .from("restaurants")
          .update({ organiser_type: "activity_provider" })
          .eq("id", venue.id);
        venue.organiser_type = "activity_provider";
      }

      setRestaurant(venue as Restaurant);

      // 2. Fetch stats
      const [{ count: bookingsCount }, { count: arenasCount }, { data: txs }] = await Promise.all([
        supabase.from("reservations").select("*", { count: "exact", head: true }).eq("restaurant_id", venue.id),
        supabase.from("menu_items").select("*", { count: "exact", head: true }).eq("restaurant_id", venue.id).eq("is_available", true),
        supabase.from("transactions").select("final_amount, created_at").eq("restaurant_id", venue.id).eq("payment_status", "completed"),
      ]);

      // Calculate earnings
      const todayStr = new Date().toISOString().split("T")[0];
      let todayEarned = 0;
      let totalEarned = 0;

      if (txs) {
        txs.forEach((tx) => {
          totalEarned += tx.final_amount || 0;
          if (tx.created_at?.startsWith(todayStr)) {
            todayEarned += tx.final_amount || 0;
          }
        });
      }

      setStats({
        totalBookings: bookingsCount || 0,
        activeArenas: arenasCount || 0,
        todaysEarnings: todayEarned,
        totalRevenue: totalEarned,
      });

      // 3. Fetch offers
      const { data: offersData } = await supabase
        .from("offers")
        .select("*")
        .eq("restaurant_id", venue.id);

      setOffers(offersData || []);
    } catch (err: any) {
      toast({ title: "Error loading dashboard", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (checked: boolean) => {
    if (!restaurant) return;
    try {
      const { error } = await supabase
        .from("restaurants")
        .update({ is_active: checked })
        .eq("id", restaurant.id);

      if (error) throw error;
      setRestaurant({ ...restaurant, is_active: checked });
      toast({ title: checked ? "Center Online" : "Center Offline", description: checked ? "Customers can view and book slots." : "New bookings are paused." });
    } catch (err: any) {
      toast({ title: "Error changing status", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full gradient-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "menu", label: "Activities", icon: Gamepad },
    { id: "reservations", label: "Slot Bookings", icon: Calendar },
    { id: "offers", label: "Offers", icon: Percent },
    { id: "earnings", label: "Earnings", icon: PiggyBank },
    { id: "settlements", label: "Settlements", icon: Wallet },
    { id: "support", label: "Support", icon: Headphones },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="default" />
            <div className="h-6 w-px bg-border" />
            <span className="text-sm font-medium text-muted-foreground">
              Activity Center Dashboard
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {restaurant && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {restaurant.is_active ? "Online" : "Offline"}
                </span>
                <Switch
                  checked={restaurant.is_active}
                  onCheckedChange={toggleActive}
                  disabled={!restaurant.is_approved}
                />
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {/* Under Review Banner */}
        {restaurant && !restaurant.is_approved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-gold/10 border border-gold/30 flex items-center gap-3 text-gold"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Pending Approval</p>
              <p className="text-xs text-muted-foreground">Your activity center profile is under review by DineDeal admin. You'll be notified once approved.</p>
            </div>
          </motion.div>
        )}

        {/* Venue Info Greeting */}
        {restaurant && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="font-display text-2xl font-bold text-foreground">{restaurant.name}</h1>
            <p className="text-muted-foreground text-sm">{restaurant.cuisine} • {restaurant.address}</p>
          </motion.div>
        )}

        {/* Tab Navigation (Matching site-wide layout) */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "secondary"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="shrink-0"
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="min-h-[500px]">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Today's Earnings", value: `₹${stats.todaysEarnings}`, icon: DollarSign, color: "text-primary" },
                  { label: "Total Bookings", value: stats.totalBookings, icon: Calendar, color: "text-blue-500" },
                  { label: "Active Slots", value: stats.activeArenas, icon: Gamepad, color: "text-green-500" },
                  { label: "Total Revenue", value: `₹${stats.totalRevenue}`, icon: TrendingUp, color: "text-purple-500" },
                ].map((stat, idx) => {
                  const StatIcon = stat.icon;
                  return (
                    <Card key={idx} className="border-border/50">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                          <p className="text-xl font-display font-bold text-foreground mt-1">{stat.value}</p>
                        </div>
                        <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                          <StatIcon className="w-5 h-5" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Welcome Card & Shortcuts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Gamepad className="w-5 h-5 text-primary" /> Welcome to your Activity Center Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Manage your turfs, gaming stations, or arcade sessions. Customers can browse your catalog, apply discounts, and book hourly slots online. Keep your slots active to increase bookings.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("menu")}>
                        Configure Arenas
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("reservations")}>
                        View Bookings
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Offers mini list */}
                <Card className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                      <span>Active Offers</span>
                      <Percent className="w-4 h-4 text-primary" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {offers.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No active slot offers. Set one up to drive bookings!</p>
                    ) : (
                      offers.slice(0, 3).map((o) => (
                        <div key={o.id} className="flex justify-between items-center p-2 rounded-lg bg-secondary/30 border border-border/30 text-xs">
                          <span className="font-semibold text-foreground">{o.title}</span>
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold">{o.discount_percent}% OFF</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "menu" && restaurant && (
            <MenuManager restaurantId={restaurant.id} isActivityProvider={true} />
          )}

          {activeTab === "reservations" && restaurant && (
            <ReservationManager restaurantId={restaurant.id} restaurantName={restaurant.name} isActivityProvider={true} />
          )}



          {activeTab === "offers" && restaurant && (
            <div className="space-y-4">
              <Card className="border-border/50 text-center p-8">
                <Percent className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">Slot Discount Campaigns</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                  Set discount rates for play slots, happy hours, or seasonal slots. Note: Offers are managed inside settings and settings views.
                </p>
                <Button onClick={() => setActiveTab("settings")} variant="outline" className="text-xs">
                  Configure Campaigns
                </Button>
              </Card>
            </div>
          )}

          {activeTab === "earnings" && restaurant && (
            <RestaurantEarningsTab restaurantId={restaurant.id} />
          )}

          {activeTab === "settlements" && restaurant && (
            <RestaurantSettlementsTab restaurantId={restaurant.id} />
          )}

          {activeTab === "settings" && restaurant && (
            <RestaurantSettings restaurant={restaurant as any} setRestaurant={setRestaurant as any} />
          )}

          {activeTab === "support" && restaurant && (
            <RestaurantSupportTab restaurantId={restaurant.id} />
          )}
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Store, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Plus, 
  Settings, 
  BarChart3,
  Receipt,
  Percent,
  Power,
  ChevronRight,
  AlertCircle,
  Upload,
  Camera,
  X,
  UtensilsCrossed,
  Calendar,
  Wallet,
  PiggyBank,
  Headphones,
  Sparkles,
  QrCode,
  Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";
import RestaurantQRCode from "@/components/RestaurantQRCode";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import MenuManager from "@/components/MenuManager";
import ReservationManager from "@/components/ReservationManager";
import RestaurantGallery from "@/components/RestaurantGallery";
import RestaurantEarningsTab from "@/components/RestaurantEarningsTab";
import RestaurantSettlementsTab from "@/components/RestaurantSettlementsTab";
import PostBillToCustomer from "@/components/PostBillToCustomer";
import RestaurantSupportTab from "@/components/RestaurantSupportTab";
import RestaurantSettings from "@/components/RestaurantSettings";
import EventManager from "@/components/events/EventManager";
import EventBookingsList from "@/components/events/EventBookingsList";
import EventCheckIn from "@/components/events/EventCheckIn";
type OrganiserType = "restaurant" | "event_group";

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  is_active: boolean;
  is_approved: boolean;
  image_url: string | null;
  is_event_organiser?: boolean;
  organiser_type?: OrganiserType;
  description?: string;
  city?: string;
  phone?: string;
  email?: string;
  open_hours?: string;
  upi_id?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_account_holder?: string;
}

interface Offer {
  id: string;
  title: string;
  discount_percent: number;
  max_discount: number;
  is_active: boolean;
}

interface DashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  totalCustomers: number;
  avgOrderValue: number;
}

const RestaurantDashboard = () => {
  const navigate = useNavigate();
  const { user, role, signOut, loading, needsRestaurantOnboarding, refresh } = useAuth();
  const { toast } = useToast();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalTransactions: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
  });
  
  const [activeTab, setActiveTab] = useState<
    "overview" | "menu" | "reservations" | "dinein" | "offers" | "transactions" | "earnings" | "settlements" | "support" |"settings"| "events" | "event-bookings" | "checkin"
  >("overview");
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const isEventOnlyOrganiser = restaurant?.organiser_type === "event_group";

  // Onboarding form state
  const [formData, setFormData] = useState({
    name: "",
    cuisine: "",
    description: "",
    address: "",
    city: "Jhansi",
    phone: "",
    email: "",
    openHours: "11:00 AM - 11:00 PM",
    upiId: "",
    bankAccountNumber: "",
    bankIfsc: "",
    bankAccountHolder: "",
  });

  useEffect(() => {
    if (!loading && (!user || role !== "restaurant" && role !== "event_organiser")) {
      navigate("/auth");
      return;
    }
    
    if (user && (role === "restaurant" || role === "event_organiser")) {
      fetchRestaurantData();
    }
  }, [user, role, loading, navigate]);

  const fetchRestaurantData = async () => {
    if (!user) return;

    try {
      // Fetch restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (restaurantError) throw restaurantError;

      if (restaurantData) {
        setRestaurant({...restaurantData,
            organiser_type:
            restaurantData.organiser_type === "event_group"
            ? "event_group"
            : "restaurant",});

        // Pre-fill form data if we have an existing row (essential for the update flow)
        setFormData(prev => ({
          ...prev,
          name: restaurantData.name || prev.name,
          cuisine: restaurantData.cuisine || prev.cuisine,
          description: restaurantData.description || prev.description,
          address: restaurantData.address || prev.address,
          city: restaurantData.city || prev.city,
          phone: restaurantData.phone || prev.phone,
          email: restaurantData.email || prev.email,
          openHours: restaurantData.open_hours || prev.openHours,
          upiId: restaurantData.upi_id || prev.upiId,
          bankAccountNumber: restaurantData.bank_account_number || prev.bankAccountNumber,
          bankIfsc: restaurantData.bank_ifsc || prev.bankIfsc,
          bankAccountHolder: restaurantData.bank_account_holder || prev.bankAccountHolder,
        }));

        // Fetch offers
        const { data: offersData } = await supabase
          .from("offers")
          .select("*")
          .eq("restaurant_id", restaurantData.id);

        setOffers(offersData || []);

        // Fetch transaction stats
        const { data: txData } = await supabase
          .from("transactions")
          .select("final_amount, restaurant_earning, user_id")
          .eq("restaurant_id", restaurantData.id)
          .eq("payment_status", "completed");

        if (txData) {
          const uniqueCustomers = new Set(txData.map(t => t.user_id)).size;
          const totalRevenue = txData.reduce((sum, t) => sum + Number(t.restaurant_earning || 0), 0);
          const totalOrders = txData.length;
          
          setStats({
            totalRevenue,
            totalTransactions: totalOrders,
            totalCustomers: uniqueCustomers,
            avgOrderValue: txData.length > 0 ? totalRevenue / txData.length : 0,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load restaurant data",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  // Real-time notifications for new transactions
  useOrderNotifications({
    restaurantId: restaurant?.id,
    enabled: !!restaurant?.id,
    onNewOrder: () => {
      fetchRestaurantData(); // Refresh stats on new transaction
    },
  });

  const handleUpdateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // UPDATE existing row instead of inserting
      const { data, error } = await supabase
        .from("restaurants")
        .update({
          name: formData.name,
          cuisine: formData.cuisine,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          phone: formData.phone,
          email: formData.email,
          open_hours: formData.openHours,
          upi_id: formData.upiId,
          bank_account_number: formData.bankAccountNumber,
          bank_ifsc: formData.bankIfsc,
          bank_account_holder: formData.bankAccountHolder,
          // We do not force is_approved/is_active here, preserving existing state or admin logic
        })
        .eq("owner_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setRestaurant({...data,
                     organiser_type:
                       data.organiser_type==="event_group"
                       ?"event_group"
                       : "restaurant" });
      
      // Refresh auth context to update needsRestaurantOnboarding state
      await refresh();
      
      toast({
        title: "Setup Complete!",
        description: "Your restaurant details have been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleRestaurantActive = async () => {
    if (!restaurant) return;

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({ is_active: !restaurant.is_active })
        .eq("id", restaurant.id);

      if (error) throw error;

      setRestaurant({ ...restaurant, is_active: !restaurant.is_active });
      toast({
        title: restaurant.is_active ? "Restaurant Deactivated" : "Restaurant Activated",
        description: restaurant.is_active 
          ? "Your restaurant is now offline" 
          : "Your restaurant is now visible to customers",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full gradient-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  // Check if this is an event organiser needing onboarding
  if (needsRestaurantOnboarding && role === "event_organiser") {
    navigate("/event-organiser-onboarding");
    return null;
  }

  // Driven purely by AuthContext state
  if (needsRestaurantOnboarding) {
    return <RestaurantOnboarding formData={formData} setFormData={setFormData} onSubmit={handleUpdateRestaurant} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="default" />
            <div className="h-6 w-px bg-border" />
            <span className="text-sm font-medium text-muted-foreground">
              {isEventOnlyOrganiser ? "Event Organiser Dashboard" : "Restaurant Dashboard"}
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
                  onCheckedChange={toggleRestaurantActive}
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

      <div className="container py-6">
        {/* Approval Status Banner */}
        {restaurant && !restaurant.is_approved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-gold/10 border border-gold/30 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-gold" />
            <div>
              <p className="font-medium text-foreground">Pending Approval</p>
              <p className="text-sm text-muted-foreground">
                Your restaurant is under review. You'll be notified once approved.
              </p>
            </div>
          </motion.div>
        )}

        {/* Restaurant Name */}
        {restaurant && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="font-display text-2xl font-bold text-foreground">{restaurant.name}</h1>
            <p className="text-muted-foreground">{restaurant.cuisine} • {restaurant.address}</p>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {[
             // Restaurant-only tabs
            ...(!isEventOnlyOrganiser ? [
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "menu", label: "Menu", icon: UtensilsCrossed },
              { id: "reservations", label: "Reservations", icon: Calendar },
              { id: "dinein", label: "Dine-In", icon: Users },
              { id: "offers", label: "Offers", icon: Percent },
              { id: "transactions", label: "Transactions", icon: Receipt },
            ] : [
              { id: "overview", label: "Overview", icon: BarChart3 },
            ]),
            // Events tabs - shown for both restaurants with events and event organisers
            ...(restaurant?.is_event_organiser || isEventOnlyOrganiser ? [
              { id: "events", label: "Events", icon: Sparkles },
              { id: "event-bookings", label: "Bookings", icon: Ticket },
              { id: "checkin", label: "Check-In", icon: QrCode },
            ] : []),
            // Common tabs
            { id: "earnings", label: "Earnings", icon: PiggyBank },
            { id: "settlements", label: "Settlements", icon: Wallet },
            { id: "support", label: "Support", icon: Headphones },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "secondary"}
              size="sm"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="shrink-0"
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<DollarSign className="w-5 h-5" />}
                label="Total Revenue"
                value={`₹${stats.totalRevenue.toLocaleString()}`}
                gradient="gradient-primary"
              />
              <StatCard
                icon={<Receipt className="w-5 h-5" />}
                label="Transactions"
                value={stats.totalTransactions.toString()}
                gradient="gradient-warm"
              />
              <StatCard
                icon={<Users className="w-5 h-5" />}
                label="Customers"
                value={stats.totalCustomers.toString()}
                gradient="gradient-gold"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Avg Order"
                value={`₹${Math.round(stats.avgOrderValue)}`}
                gradient="gradient-success"
              />
            </div>

            {/* Active Offers Summary */}
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Active Offers</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("offers")}>
                  Manage
                </Button>
              </CardHeader>
              <CardContent>
                {offers.filter(o => o.is_active).length > 0 ? (
                  <div className="space-y-3">
                    {offers.filter(o => o.is_active).slice(0, 3).map((offer) => (
                      <div key={offer.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary">
                        <div>
                          <p className="font-medium text-foreground">{offer.title}</p>
                          <p className="text-sm text-muted-foreground">Max ₹{offer.max_discount} off</p>
                        </div>
                        <span className="text-xl font-bold gradient-text">{offer.discount_percent}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Percent className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No active offers</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveTab("offers")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Offer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "menu" && restaurant && (
          <MenuManager restaurantId={restaurant.id} />
        )}

        {activeTab === "reservations" && restaurant && (
          <ReservationManager restaurantId={restaurant.id} restaurantName={restaurant.name} />
        )}

        {activeTab === "settings" && restaurant && (
          <div className="space-y-6">
            <RestaurantGallery restaurantId={restaurant.id} editable />
            <RestaurantSettings restaurant={restaurant} setRestaurant={setRestaurant} />
          </div>
        )}

        {activeTab === "offers" && (
          <OffersTab restaurantId={restaurant?.id} offers={offers} setOffers={setOffers} />
        )}

        {activeTab === "transactions" && (
          <TransactionsTab restaurantId={restaurant?.id} />
        )}

        {/* Merged Earnings Tab */}
        {activeTab === "earnings" && restaurant && (
          <RestaurantEarningsTab restaurantId={restaurant.id} />
        )}

        {/* Merged Settlements Tab */}
        {activeTab === "settlements" && restaurant && (
          <RestaurantSettlementsTab restaurantId={restaurant.id} />
        )}

        {activeTab === "dinein" && restaurant && (
          <PostBillToCustomer restaurantId={restaurant.id} />
        )}

        {activeTab === "support" && restaurant && ( 
          <RestaurantSupportTab restaurantId={restaurant.id} />
        )}
         {/* Event Tabs */}
        {activeTab === "events" && restaurant && (
          <EventManager restaurantId={restaurant.id} restaurantName={restaurant.name} />
        )}

        {activeTab === "event-bookings" && restaurant && (
          <EventBookingsList restaurantId={restaurant.id} />
        )}

        {activeTab === "checkin" && restaurant && (
          <EventCheckIn restaurantId={restaurant.id} />
        )}

      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, label, value, gradient }: { icon: React.ReactNode; label: string; value: string; gradient: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
  >
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center text-primary-foreground mb-3`}>
          {icon}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  </motion.div>
);

// Onboarding Component
const RestaurantOnboarding = ({ formData, setFormData, onSubmit }: any) => (
  <div className="min-h-screen bg-background py-12">
    <div className="container max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Set Up Your Restaurant</h1>
          <p className="text-muted-foreground">Tell us about your restaurant to get started</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            placeholder="Restaurant Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            placeholder="Cuisine Type (e.g., Italian, Indian) *"
            value={formData.cuisine}
            onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
            required
          />
          <Textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
          <Input
            placeholder="Full Address *"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <Input
            type="email"
            placeholder="Business Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            placeholder="Open Hours (e.g., 11:00 AM - 11:00 PM)"
            value={formData.openHours}
            onChange={(e) => setFormData({ ...formData, openHours: e.target.value })}
          />

          {/* Payment Details Section */}
          <div className="pt-4 border-t border-border/50">
            <h3 className="font-semibold text-foreground mb-3">Payment Details (Secure)</h3>
            <p className="text-xs text-muted-foreground mb-4">
              This information is securely stored and used for receiving payments from customers.
            </p>
            <div className="space-y-4">
              <Input
                placeholder="UPI ID (e.g., restaurant@paytm) *"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                required
              />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or add bank details</span>
                </div>
              </div>
              <Input
                placeholder="Bank Account Number"
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="IFSC Code"
                  value={formData.bankIfsc}
                  onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value })}
                />
                <Input
                  placeholder="Account Holder Name"
                  value={formData.bankAccountHolder}
                  onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Button type="submit" variant="gradient" size="xl" className="w-full">
            Complete Setup
          </Button>
        </form>
      </motion.div>
    </div>
  </div>
);

// Offers Tab
const OffersTab = ({ restaurantId, offers, setOffers }: { restaurantId?: string; offers: Offer[]; setOffers: (o: Offer[]) => void }) => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [newOffer, setNewOffer] = useState({
    title: "",
    discount_percent: 10,
    max_discount: 500,
    terms: "",
  });

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    try {
      const { data, error } = await supabase
        .from("offers")
        .insert({
          restaurant_id: restaurantId,
          title: newOffer.title,
          discount_percent: newOffer.discount_percent,
          max_discount: newOffer.max_discount,
          terms: newOffer.terms,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setOffers([...offers, data]);
      setShowForm(false);
      setNewOffer({ title: "", discount_percent: 10, max_discount: 500, terms: "" });
      toast({ title: "Offer Created!", description: "Your new offer is now active." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleOffer = async (offer: Offer) => {
    try {
      const { error } = await supabase
        .from("offers")
        .update({ is_active: !offer.is_active })
        .eq("id", offer.id);

      if (error) throw error;

      setOffers(offers.map(o => o.id === offer.id ? { ...o, is_active: !o.is_active } : o));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg text-foreground">Manage Offers</h2>
        <Button variant="gradient" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Offer
        </Button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <Card className="border-primary/30">
            <CardContent className="p-4">
              <form onSubmit={handleCreateOffer} className="space-y-4">
                <Input
                  placeholder="Offer Title (e.g., Flat 20% Off)"
                  value={newOffer.title}
                  onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Discount %</label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={newOffer.discount_percent}
                      onChange={(e) => setNewOffer({ ...newOffer, discount_percent: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Max Discount (₹)</label>
                    <Input
                      type="number"
                      min={50}
                      value={newOffer.max_discount}
                      onChange={(e) => setNewOffer({ ...newOffer, max_discount: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <Input
                  placeholder="Terms & Conditions"
                  value={newOffer.terms}
                  onChange={(e) => setNewOffer({ ...newOffer, terms: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button type="submit" variant="gradient" size="sm">Create</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="space-y-3">
        {offers.map((offer) => (
          <Card key={offer.id} className="border-border/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{offer.title}</p>
                <p className="text-sm text-muted-foreground">{offer.discount_percent}% off, max ₹{offer.max_discount}</p>
              </div>
              <Switch
                checked={offer.is_active}
                onCheckedChange={() => toggleOffer(offer)}
              />
            </CardContent>
          </Card>
        ))}

        {offers.length === 0 && (
          <div className="text-center py-12">
            <Percent className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No offers yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Transactions Tab
const TransactionsTab = ({ restaurantId }: { restaurantId?: string }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      fetchTransactions();
    }
  }, [restaurantId]);

  const fetchTransactions = async () => {
    try {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(50);

      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading transactions...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-lg text-foreground">Recent Transactions</h2>
      
      {transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <Card key={tx.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">₹{tx.bill_amount}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tx.payment_status === "completed" 
                        ? "bg-success/10 text-success" 
                        : tx.payment_status === "failed"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-gold/10 text-gold"
                    }`}>
                      {tx.payment_status}
                    </span>
                    <p className="text-sm text-success mt-1">-₹{tx.discount_amount} discount</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No transactions yet</p>
        </div>
      )}
    </div>
  );
};



export default RestaurantDashboard;










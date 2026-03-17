import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Sparkles, ArrowRight, ChevronDown, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import RestaurantCard from "@/components/RestaurantCard";
import QuickStats from "@/components/QuickStats";
import FilterChips from "@/components/FilterChips";
import BottomNav from "@/components/BottomNav";
import { LocationSelector } from "@/components/LocationSelector";
import { useLocation } from "@/contexts/LocationContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import heroIllustration from "@/assets/hero-illustration.png";
import restaurant1 from "@/assets/restaurant-1.jpg";
import restaurant2 from "@/assets/restaurant-2.jpg";
import restaurant3 from "@/assets/restaurant-3.jpg";
import restaurant4 from "@/assets/restaurant-4.jpg";
import restaurant5 from "@/assets/restaurant-5.jpg";

const defaultImages = [restaurant1, restaurant2, restaurant3, restaurant4, restaurant5];

const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return { isInstallable, promptInstall };
};

const filters = [
  { id: "all", label: "All" },
  { id: "popular", label: "🔥 Popular" },
  { id: "nearby", label: "📍 Nearby" },
  { id: "high-discount", label: "💰 High Savings" },
];

const Index = () => {
  const { user, role, loading } = useAuth();
  const { city, coordinates, detectLocation } = useLocation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [activePromo, setActivePromo] = useState<any>(null);
  const [stats, setStats] = useState({ totalSaved: 0, transactionCount: 0, rewardPoints: 0, redeemable: 0 });

  const fetchActivePromotion = async () => {
    try {
      const { data } = await (supabase.from("promotions" as any) as any)
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (data) setActivePromo(data);
    } catch (err) {
      console.error("Promotions table not found yet");
    }
  };

  // Frontend Haversine Fallback
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchUserStats = async () => {
    if (!user) return;

    // 1. Fetch Transactions for Total Saved and Count
    const { data: txData, error: txError } = await (supabase.from("transactions" as any) as any)
      .select("discount_amount")
      .eq("user_id", user.id)
      .eq("payment_status", "completed");

    // 2. Fetch Rewards directly from the `rewards` table (ignoring the broken view)
    const { data: rewardsData, error: rewardsError } = await (supabase.from("rewards" as any) as any)
      .select("points")
      .eq("user_id", user.id)
      .maybeSingle();

    if (txError) {
      console.error("Error fetching stats:", txError);
      return;
    }

    if (txData) {
      const total = txData.reduce((acc: number, curr: any) => acc + (Number(curr.discount_amount) || 0), 0);
      const points = rewardsData?.points || 0;
      // Define a conversion rate: 10 points = ₹1
      const redeemableValue = Math.floor(points / 10); 

      setStats({
        totalSaved: total,
        transactionCount: txData.length,
        rewardPoints: points,
        redeemable: redeemableValue
      });
    }
  };

  // Removed redundant detectLocation since it's handled by LocationContext
  // Auto-detect on first load if no city is set
  useEffect(() => {
    if (user && !city && !coordinates) {
      detectLocation();
    }
  }, [user, city, coordinates, detectLocation]);

  const fetchRestaurants = async () => {
    let query = supabase
      .from("restaurants")
      .select("*, offers(*)")
      .eq("is_approved", true)
      .eq("is_active", true)
      .neq("organiser_type", "event_group");

    // Try Haversine RPC for exact distance sorting if coordinates exist
    if (coordinates || city) {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_nearby_restaurants' as any, {
        user_lat: coordinates?.lat || null,
        user_lon: coordinates?.lng || null,
        user_city: city || null,
        max_distance_km: 50
      });

      // If RPC succeeds, map and return immediately
      if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        const mapped = rpcData.map((r: any, i: number) => ({
          ...r,
          imageUrl: r.image_url || defaultImages[i % defaultImages.length],
          discount: 0, // RPC doesn't join offers, a separate query could fetch these
          distance: r.distance_km ? `${r.distance_km.toFixed(1)} km` : "Nearby",
          rating: r.rating || 0,
        }));
        setRestaurants(mapped);
        return;
      }
      
      // Fallback to standard Supabase query by city if RPC fails or isn't installed
      if (city && (rpcError || !rpcData || rpcData.length === 0)) {
        query = query.ilike("city", `%${city}%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching restaurants:", error);
      return;
    }

    const mapped = (data || []).map((r: any, i: number) => {
      let distanceText = "Nearby";
      
      // Apply Frontend Haversine if we have both coordinates
      if (coordinates && r.latitude && r.longitude) {
        const distKm = calculateDistance(
          coordinates.lat, 
          coordinates.lng, 
          Number(r.latitude), 
          Number(r.longitude)
        );
        distanceText = `${distKm.toFixed(1)} km`;
      }

      return {
        ...r,
        imageUrl: r.image_url || defaultImages[i % defaultImages.length],
        discount: r.offers?.[0]?.discount_percent || 0,
        distance: distanceText,
        rating: r.rating || 0,
      };
    });
    setRestaurants(mapped);
  };

  useEffect(() => {
    if (!loading && user) {
      if (role === "restaurant") {
        navigate("/restaurant-dashboard");
      } else if (role === "admin") {
        navigate("/admin");
      }
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    fetchRestaurants();
    fetchActivePromotion();
    if (user) {
      fetchUserStats();
    }
  }, [user, city, coordinates]); // Re-fetch when location changes

  if (!user) return <LandingPage />;

  return (
    <div className="min-h-screen bg-background pb-24">
      <motion.header
        className="sticky top-0 z-40 glass border-b border-border/30"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="default" />
            <div className="h-6 w-px bg-border" />
            <LocationSelector />
          </div>
          <Link to="/profile">
            <motion.div
              className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm"
              whileHover={{ scale: 1.05 }}
            >
              {user.email?.charAt(0).toUpperCase()}
            </motion.div>
          </Link>
        </div>
      </motion.header>

      <main className="container py-6 space-y-6">
        <QuickStats
          totalSaved={stats.totalSaved}
          transactions={stats.transactionCount}
          rewards={stats.rewardPoints}
          redeemable={stats.redeemable}
        />

        {activePromo && (
          <motion.div
            className="relative overflow-hidden rounded-3xl gradient-primary p-6 text-primary-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">{activePromo.tag || "Special Offer"}</span>
              </div>
              <h3 className="font-display text-2xl font-bold mb-2">{activePromo.title}</h3>
              <p className="text-sm opacity-80 mb-4">{activePromo.description}</p>
              <Button variant="glass" size="sm" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                Claim Now
              </Button>
            </div>
          </motion.div>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-foreground">Nearby Restaurants</h2>
            <Link to="/explore" className="text-sm text-primary font-medium flex items-center gap-1">
              See All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <FilterChips filters={filters} activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          <motion.div className="grid gap-4 mt-4" layout>
            <AnimatePresence>
              {restaurants.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <RestaurantCard
                    id={r.id}
                    name={r.name}
                    cuisine={r.cuisine}
                    distance={r.distance}
                    rating={r.rating}
                    discount={r.discount}
                    imageUrl={r.imageUrl}
                    isPopular={r.is_popular || false}
                    address={r.address}
                    latitude={r.latitude}
                    longitude={r.longitude}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          {restaurants.length === 0 && (
            <div className="text-center py-16 px-4 bg-orange-50/50 rounded-3xl border border-orange-100 mt-6">
              <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Sorry, {city ? city : "this area"} is not serviceable yet
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                We are expanding rapidly and will be coming to {city ? city : "your area"} soon. Try selecting a different location or check back later!
              </p>
            </div>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
};

const LandingPage = () => {
  const { isInstallable, promptInstall } = useInstallPrompt();

  return (
    <div className="min-h-screen bg-background">
      <header className="container py-6 flex items-center justify-between">
        <Logo size="lg" />
        <div className="flex items-center gap-4">
          {isInstallable && (
            <Button variant="outline" onClick={promptInstall} className="gap-2">
              <Download className="w-4 h-4" />
              Install App
            </Button>
          )}
          <Link to="/auth"><Button variant="ghost">Sign In</Button></Link>
          <Link to="/auth"><Button variant="gradient">Get Started</Button></Link>
        </div>
      </header>
      <main className="container py-12 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6">
              Dine Local. <span className="gradient-text">Save More.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Pay at your favorite restaurants through DineDeal and get instant discounts, cashback, and exclusive rewards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/explore">
                <Button variant="gradient" size="xl">
                  Start Saving Now <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/explore"><Button variant="outline" size="xl">Explore Restaurants</Button></Link>
            </div>
            {isInstallable && (
              <motion.div
                className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-sm text-muted-foreground mb-2">📱 Get the best experience</p>
                <Button variant="gradient" size="sm" onClick={promptInstall} className="gap-2">
                  <Download className="w-4 h-4" />
                  Install DineDeal App
                </Button>
              </motion.div>
            )}
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="relative">
            <motion.img
              src={heroIllustration}
              alt="DineDeal"
              className="w-full max-w-lg mx-auto"
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Index;

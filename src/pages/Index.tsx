import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { MapPin, Sparkles, ArrowRight, ChevronDown, Loader2, Download, Gamepad } from "lucide-react";
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

const isMobileCustomer = import.meta.env.VITE_APP_TARGET === "mobile-customer";

const Index = () => {
  const { user, role, loading } = useAuth();
  const { city, coordinates, detectLocation } = useLocation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
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
      .neq("organiser_type", "event_group")
      .neq("organiser_type", "activity_provider");

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
        // Filter out event groups and activity providers from RPC results
        const filtered = rpcData.filter((r: any) => 
          r.organiser_type !== "event_group" && r.organiser_type !== "activity_provider"
        );
        const mapped = filtered.map((r: any, i: number) => ({
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

  const fetchActivities = async () => {
    try {
      let query = supabase
        .from("restaurants")
        .select("*, offers(*)")
        .eq("is_approved", true)
        .eq("is_active", true)
        .eq("organiser_type", "activity_provider");

      if (city) {
        query = query.ilike("city", `%${city}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped = (data || []).map((r: any, i: number) => {
        let distanceText = "Nearby";
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

      setActivities(mapped);
    } catch (err) {
      console.error("Error fetching activities:", err);
    }
  };

  useEffect(() => {
    if (!loading && user && !isMobileCustomer) {
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
    fetchActivities();
    if (user) {
      fetchUserStats();
    }
  }, [user, city, coordinates]); // Re-fetch when location changes

  if (!user) {
    if (isMobileCustomer) {
      return <Navigate to="/auth" replace />;
    }
    return <LandingPage />;
  }

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
                DineDeal is currently serviceable only in Jhansi. We are expanding rapidly and will be coming to {city ? city : "your area"} soon. Try selecting a different location or check back later!
              </p>
            </div>
          )}
        </section>

        {activities.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gamepad className="w-5 h-5 text-primary animate-pulse" />
                <h2 className="font-display font-bold text-lg text-foreground">Play, Turfs & Games</h2>
              </div>
              <Link 
                to="/explore" 
                onClick={() => {
                  // Navigate to explore with activities tab selected
                  localStorage.setItem("explore_initial_tab", "activities");
                }}
                className="text-sm text-primary font-medium flex items-center gap-1"
              >
                See All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <motion.div className="grid gap-4 mt-4" layout>
              <AnimatePresence>
                {activities.map((r, i) => (
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
          </section>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

const LandingPage = () => {
  const { isInstallable, promptInstall } = useInstallPrompt();

  return (
    <div className="min-h-screen bg-[#FCFAF5] relative overflow-hidden flex flex-col">
      {/* Decorative top border in Madhubani style */}
      <div className="w-full h-3 bg-[#626B33] relative overflow-hidden flex z-50">
        <svg className="w-full h-full" width="100%" height="12" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="landing-ethnic-border" width="20" height="12" patternUnits="userSpaceOnUse">
              {/* Grain/wheat stalks symbol in light cream */}
              <line x1="10" y1="2" x2="10" y2="10" stroke="#F6F3EB" strokeWidth="1" />
              <circle cx="10" cy="2" r="1.2" fill="#F6F3EB" />
              <path d="M7 4 C 8 3, 9 3, 10 4" stroke="#F6F3EB" strokeWidth="0.8" fill="none" />
              <path d="M13 4 C 12 3, 11 3, 10 4" stroke="#F6F3EB" strokeWidth="0.8" fill="none" />
              <path d="M7 7 C 8 6, 9 6, 10 7" stroke="#F6F3EB" strokeWidth="0.8" fill="none" />
              <path d="M13 7 C 12 6, 11 6, 10 7" stroke="#F6F3EB" strokeWidth="0.8" fill="none" />
              {/* Orange floral dot */}
              <circle cx="20" cy="6" r="2.2" fill="#E2871A" />
            </pattern>
          </defs>
          <rect width="100%" height="12" fill="url(#landing-ethnic-border)" />
        </svg>
      </div>

      {/* Decorative background watermark sun and mandala */}
      <div className="absolute top-24 -left-12 opacity-[0.03] pointer-events-none text-[#E2871A] z-0">
        <svg className="w-64 h-64" style={{ animation: 'spin 40s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v22M1 12h22M4.22 4.22l15.56 15.56M4.22 19.78L19.78 4.22" />
        </svg>
      </div>
      <div className="absolute bottom-16 -right-12 opacity-[0.03] pointer-events-none text-[#E2871A] z-0">
        <svg className="w-80 h-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
        </svg>
      </div>

      <header className="container py-6 flex items-center justify-between relative z-10">
        <Logo size="lg" />
        <div className="flex items-center gap-4">
          {isInstallable && (
            <Button 
              variant="outline" 
              onClick={promptInstall} 
              className="gap-2 border-[#626B33] text-[#626B33] hover:bg-[#626B33]/10"
            >
              <Download className="w-4 h-4" />
              Install App
            </Button>
          )}
          <Link to="/auth">
            <Button variant="ghost" className="text-[#626B33] hover:text-[#4F5429] hover:bg-[#626B33]/5 font-bold">
              Sign In
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-[#E2871A] hover:bg-[#C17013] text-white shadow-md rounded-xl font-bold px-4 py-2">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-12 md:py-24 flex-1 flex items-center relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} className="text-left">
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-[#555D28] leading-tight mb-6 tracking-tight">
              Dine Local. <span className="text-[#E2871A]">Save More.</span>
            </h1>
            <p className="text-lg text-[#3D3E24] mb-8 max-w-lg font-medium leading-relaxed">
              Pay at your favorite restaurants through DineDeal and get instant discounts, cashback, and exclusive rewards.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/explore">
                <Button className="bg-[#E2871A] hover:bg-[#C17013] text-white rounded-2xl shadow-lg border-0 transition-all duration-300 font-bold px-8 py-6 text-lg gap-2">
                  Start Saving Now <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/explore">
                <Button variant="outline" className="border-[#626B33] text-[#626B33] hover:bg-[#626B33]/10 rounded-2xl transition-all duration-300 font-bold px-8 py-6 text-lg">
                  Explore Restaurants
                </Button>
              </Link>
            </div>
            {isInstallable && (
              <motion.div
                className="mt-8 p-5 rounded-2xl bg-[#F3ECE0] border-2 border-[#D9CDBB]/70 shadow-sm relative overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {/* Background sun watermark */}
                <div className="absolute -right-4 -bottom-4 opacity-[0.07] pointer-events-none text-[#E2871A]">
                  <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
                  </svg>
                </div>
                <p className="text-sm font-serif font-bold text-[#555D28] mb-2">📱 Get the best experience</p>
                <Button 
                  onClick={promptInstall} 
                  className="bg-[#626B33] hover:bg-[#4F5429] text-white rounded-xl shadow-md gap-2"
                >
                  <Download className="w-4 h-4" />
                  Install DineDeal App
                </Button>
              </motion.div>
            )}
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="relative z-10">
            <motion.img
              src={heroIllustration}
              alt="DineDeal"
              className="w-full max-w-lg mx-auto mix-blend-multiply opacity-95"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </main>

      <footer className="container py-8 border-t border-[#D9CDBB]/70 mt-auto text-center text-sm text-[#4F5425] flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
        <span>© {new Date().getFullYear()} DineDeal. All rights reserved.</span>
        <div className="flex items-center gap-6 font-medium">
          <Link to="/privacy" className="hover:text-[#E2871A] transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-[#E2871A] transition-colors">Terms of Service</Link>
          <Link to="/help" className="hover:text-[#E2871A] transition-colors">FAQs</Link>
        </div>
      </footer>

      {/* Decorative bottom border in Madhubani style */}
      <div className="w-full h-3 bg-[#626B33] relative overflow-hidden flex z-50">
        <svg className="w-full h-full" width="100%" height="12" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="12" fill="url(#landing-ethnic-border)" />
        </svg>
      </div>
    </div>
  );
};

export default Index;

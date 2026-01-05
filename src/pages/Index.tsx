import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Sparkles, ArrowRight, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import RestaurantCard from "@/components/RestaurantCard";
import QuickStats from "@/components/QuickStats";
import FilterChips from "@/components/FilterChips";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import heroIllustration from "@/assets/hero-illustration.png";
import restaurant1 from "@/assets/restaurant-1.jpg";
import restaurant2 from "@/assets/restaurant-2.jpg";
import restaurant3 from "@/assets/restaurant-3.jpg";
import restaurant4 from "@/assets/restaurant-4.jpg";
import restaurant5 from "@/assets/restaurant-5.jpg";

const defaultImages = [restaurant1, restaurant2, restaurant3, restaurant4, restaurant5];
const filters = [
  { id: "all", label: "All" },
  { id: "popular", label: "🔥 Popular" },
  { id: "nearby", label: "📍 Nearby" },
  { id: "high-discount", label: "💰 High Savings" },
];

const Index = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [location, setLocation] = useState("Detecting...");
  const [isLocating, setIsLocating] = useState(true);

  // Check if today is weekend (Saturday = 6, Sunday = 0)
  const isWeekend = () => {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  };

  const detectLocation = async () => {
    setIsLocating(true);
    try {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
              );
              const data = await response.json();
              const city = data.address?.city || 
                          data.address?.town || 
                          data.address?.village || 
                          data.address?.district ||
                          "Jhansi";
              setLocation(city);
            } catch (error) {
              console.error("Reverse geocoding failed:", error);
              setLocation("Jhansi");
            }
            setIsLocating(false);
          },
          () => {
            setLocation("Jhansi");
            setIsLocating(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setLocation("Jhansi");
        setIsLocating(false);
      }
    } catch (error) {
      setLocation("Jhansi");
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (!loading && user && role === "restaurant") {
      navigate("/restaurant-dashboard");
    } else if (!loading && user && role === "admin") {
      navigate("/admin");
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    fetchRestaurants();
    if (user) {
      detectLocation();
    }
  }, [user]);

  const fetchRestaurants = async () => {
    const { data } = await supabase
      .from("restaurants")
      .select("*, offers(*)")
      .eq("is_approved", true)
      .eq("is_active", true);
    
    const mapped = (data || []).map((r, i) => ({
      ...r,
      imageUrl: r.image_url || defaultImages[i % defaultImages.length],
      discount: r.offers?.[0]?.discount_percent || 15,
      distance: `${(Math.random() * 3 + 0.5).toFixed(1)} km`,
    }));
    setRestaurants(mapped);
  };

  if (!user) return <LandingPage />;

  return (
    <div className="min-h-screen bg-background pb-24">
      <motion.header className="sticky top-0 z-40 glass border-b border-border/30" initial={{ y: -100 }} animate={{ y: 0 }}>
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="default" />
            <div className="h-6 w-px bg-border" />
            <button className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              {isLocating ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Detecting...
                </span>
              ) : (
                <span>{location}</span>
              )}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <Link to="/profile">
            <motion.div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm" whileHover={{ scale: 1.05 }}>
              {user.email?.charAt(0).toUpperCase()}
            </motion.div>
          </Link>
        </div>
      </motion.header>

      <main className="container py-6 space-y-6">
        <QuickStats />
        
        {/* Weekend Cashback Banner - Only show on weekends */}
        {isWeekend() && (
          <motion.div className="relative overflow-hidden rounded-3xl gradient-primary p-6 text-primary-foreground" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2"><Sparkles className="w-5 h-5" /><span className="text-sm font-medium opacity-90">Weekend Special</span></div>
              <h3 className="font-display text-2xl font-bold mb-2">Extra 10% Cashback</h3>
              <p className="text-sm opacity-80 mb-4">Pay at any restaurant this weekend!</p>
              <Button variant="glass" size="sm" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">Claim Now</Button>
            </div>
          </motion.div>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-foreground">Nearby Restaurants</h2>
            <Link to="/explore" className="text-sm text-primary font-medium flex items-center gap-1">See All <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <FilterChips filters={filters} activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          <motion.div className="grid gap-4 mt-4" layout>
            <AnimatePresence>
              {restaurants.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <RestaurantCard id={r.id} name={r.name} cuisine={r.cuisine} distance={r.distance} rating={r.rating || 4.5} discount={r.discount} imageUrl={r.imageUrl} isPopular={i < 2} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          {restaurants.length === 0 && <p className="text-center py-12 text-muted-foreground">No restaurants available yet. Check back soon!</p>}
        </section>
      </main>
      <BottomNav />
    </div>
  );
};
const LandingPage = () => (
  <div className="min-h-screen bg-background">
    <header className="container py-6 flex items-center justify-between">
      <Logo size="lg" />
      <div className="flex items-center gap-4">
        <Link to="/auth"><Button variant="ghost">Sign In</Button></Link>
        <Link to="/auth"><Button variant="gradient">Get Started</Button></Link>
      </div>
    </header>
    <main className="container py-12 md:py-24">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6">Dine Local. <span className="gradient-text">Save More.</span></h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg">Pay at your favorite restaurants through DineDeal and get instant discounts, cashback, and exclusive rewards.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/auth"><Button variant="gradient" size="xl">Start Saving Now <ArrowRight className="w-5 h-5" /></Button></Link>
            <Link to="/explore"><Button variant="outline" size="xl">Explore Restaurants</Button></Link>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="relative">
          <motion.img src={heroIllustration} alt="DineDeal" className="w-full max-w-lg mx-auto" animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 4 }} />
        </motion.div>
      </div>
    </main>
  </div>
);
export default Index;

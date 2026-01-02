import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RestaurantCard from "@/components/RestaurantCard";
import FilterChips from "@/components/FilterChips";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { restaurants } from "@/data/mockData";

const filters = [
  { id: "all", label: "All" },
  { id: "popular", label: "🔥 Popular" },
  { id: "nearby", label: "📍 Nearby" },
  { id: "high-discount", label: "💰 High Savings" },
  { id: "cafe", label: "☕ Cafes" },
  { id: "italian", label: "🍝 Italian" },
  { id: "asian", label: "🍜 Asian" },
  { id: "fine-dining", label: "🍷 Fine Dining" },
];

const Explore = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("Jhansi");
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    detectLocation();
  }, []);

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

  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeFilter === "all") return true;
    if (activeFilter === "popular") return r.isPopular;
    if (activeFilter === "nearby") return parseFloat(r.distance) < 2;
    if (activeFilter === "high-discount") return r.discount >= 20;
    if (activeFilter === "cafe") return r.cuisine.toLowerCase().includes("cafe");
    if (activeFilter === "italian") return r.cuisine.toLowerCase().includes("italian");
    if (activeFilter === "asian") return r.cuisine.toLowerCase().includes("japanese") || r.cuisine.toLowerCase().includes("asian");
    if (activeFilter === "fine-dining") return r.cuisine.toLowerCase().includes("fine dining");
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <motion.header
        className="sticky top-0 z-40 glass border-b border-border/30"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="container py-4 space-y-4">
          <div className="flex items-center justify-between">
            <Logo size="default" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{isLocating ? "Detecting..." : location}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search restaurants, cuisines..."
                className="pl-10 bg-secondary border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="container py-4 space-y-4">
        <FilterChips
          filters={filters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredRestaurants.length} restaurants found
          </p>
        </div>

        <motion.div className="grid gap-4" layout>
          <AnimatePresence mode="popLayout">
            {filteredRestaurants.map((restaurant, index) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <RestaurantCard {...restaurant} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredRestaurants.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground mb-2">
              No restaurants found
            </h3>
            <p className="text-muted-foreground text-sm">
              Try adjusting your search or filters
            </p>
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Explore;

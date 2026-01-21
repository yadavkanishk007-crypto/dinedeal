import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RestaurantCard from "@/components/RestaurantCard";
import FilterChips from "@/components/FilterChips";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

interface RestaurantDB {
  id: string;
  name: string;
  cuisine: string;
  distance: number | string;
  rating: number;
  discount: number;
  image_url: string;
  is_popular: boolean;
  location?: string;
}

/* ------------------------------------------------------------------ */
/* Filters */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

const Explore = () => {
  const [restaurants, setRestaurants] = useState<RestaurantDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [location, setLocation] = useState("Jhansi");
  const [isLocating, setIsLocating] = useState(false);

  /* ---------------------------------------------------------------- */
  /* Fetch Restaurants */
  /* ---------------------------------------------------------------- */

  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*");

      if (error) throw error;

      setRestaurants((data as RestaurantDB[]) ?? []);
    } catch (err) {
      console.error("Failed to fetch restaurants:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ---------------------------------------------------------------- */
  /* Detect Location (UI only for now) */
  /* ---------------------------------------------------------------- */

  const detectLocation = async () => {
    setIsLocating(true);

    if (!("geolocation" in navigator)) {
      setLocation("Jhansi");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
          );
          const data = await res.json();

          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.district ||
            "Jhansi";

          setLocation(city);
        } catch {
          setLocation("Jhansi");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setLocation("Jhansi");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /* ---------------------------------------------------------------- */
  /* Effects */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    detectLocation();
    fetchRestaurants();
  }, [fetchRestaurants]);

  /* ---------------------------------------------------------------- */
  /* Filtering Logic */
  /* ---------------------------------------------------------------- */

  const filteredRestaurants = restaurants.filter((r) => {
    const name = r.name?.toLowerCase() ?? "";
    const cuisine = r.cuisine?.toLowerCase() ?? "";
    const query = searchQuery.toLowerCase();

    const distanceVal = Number(r.distance) || 0;

    const matchesSearch =
      name.includes(query) || cuisine.includes(query);

    if (!matchesSearch) return false;

    switch (activeFilter) {
      case "popular":
        return r.is_popular;

      case "nearby":
        return distanceVal < 2;

      case "high-discount":
        return r.discount >= 20;

      case "cafe":
        return cuisine.includes("cafe");

      case "italian":
        return cuisine.includes("italian");

      case "asian":
        return cuisine.includes("asian") || cuisine.includes("japanese");

      case "fine-dining":
        return cuisine.includes("fine dining");

      default:
        return true;
    }
  });

  /* ---------------------------------------------------------------- */
  /* Render */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
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
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <main className="container py-4 space-y-4">
        <FilterChips
          filters={filters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <p className="text-sm text-muted-foreground">
          {isLoading
            ? "Loading restaurants..."
            : `${filteredRestaurants.length} restaurants found`}
        </p>

        <motion.div className="grid gap-4" layout>
          <AnimatePresence mode="popLayout">
            {filteredRestaurants.map((r, index) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <RestaurantCard
                  id={r.id}
                  name={r.name}
                  cuisine={r.cuisine}
                  distance={`${Number(r.distance) || 0} km`}
                  rating={r.rating}
                  discount={r.discount}
                  imageUrl={r.image_url}
                  isPopular={r.is_popular}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {!isLoading && filteredRestaurants.length === 0 && (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Search className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-bold text-lg">No restaurants found</h3>
            <p className="text-sm text-muted-foreground">
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

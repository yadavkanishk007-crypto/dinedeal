import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, SlidersHorizontal, Utensils, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RestaurantCard from "@/components/RestaurantCard";
import FilterChips from "@/components/FilterChips";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import ExploreEvents from "@/components/ExploreEvents";

/* =========================================================
   UI MODEL
========================================================= */
interface RestaurantUI {
  id: string;
  name: string;
  cuisine: string;
  distance: string;
  rating: number;
  discount: number;
  imageUrl: string;
  isPopular: boolean;
}

/* =========================================================
   FILTERS
========================================================= */
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
  const [restaurants, setRestaurants] = useState<RestaurantUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("Jhansi");
  const [isLocating, setIsLocating] = useState(false);
  const [viewMode, setViewMode] = useState<"restaurants" | "events">("restaurants");

  /* =========================================================
     FETCH + NORMALIZE (FILTERED FOR APPROVED & NOT DELETED)
  ========================================================= */
  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);

    try {
      // Added filter: status must be 'approved' and is_deleted must be false
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("status", "approved") 
        .eq("is_deleted", false) as any; 

      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];

      const normalized: RestaurantUI[] = rows.map((row: any) => ({
        id: String(row.id),
        name: String(row.name ?? "Unnamed Restaurant"),
        cuisine: String(row.cuisine ?? "Multi-cuisine"),
        distance: `${Number(row.distance ?? 0)} km`,
        rating: Number(row.rating ?? 4),
        discount: Number(row.discount ?? 0),
        imageUrl:
          typeof row.image_url === "string" && row.image_url.length > 0
            ? row.image_url
            : "/images/restaurant-placeholder.jpg",
        isPopular: Boolean(row.is_popular),
      }));

      setRestaurants(normalized);
    } catch (err) {
      console.error("❌ Failed to fetch restaurants:", err);
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* =========================================================
     LOCATION (UI ONLY)
  ========================================================= */
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
          const json = await res.json();
          setLocation(
            json.address?.city || json.address?.town || json.address?.district || "Jhansi"
          );
        } catch {
          setLocation("Jhansi");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setLocation("Jhansi");
        setIsLocating(false);
      }
    );
  };

  useEffect(() => {
    detectLocation();
    fetchRestaurants();
  }, [fetchRestaurants]);

  /* =========================================================
     FILTER LOGIC
  ========================================================= */
  const filteredRestaurants = restaurants.filter((r) => {
    const q = searchQuery.toLowerCase();
    const name = r.name.toLowerCase();
    const cuisine = r.cuisine.toLowerCase();
    const distanceVal = Number(r.distance.replace(" km", ""));

    if (!name.includes(q) && !cuisine.includes(q)) return false;

    switch (activeFilter) {
      case "popular": return r.isPopular;
      case "nearby": return distanceVal < 2;
      case "high-discount": return r.discount >= 20;
      case "cafe": return cuisine.includes("cafe");
      case "italian": return cuisine.includes("italian");
      case "asian": return cuisine.includes("asian") || cuisine.includes("japanese");
      case "fine-dining": return cuisine.includes("fine dining");
      default: return true;
    }
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

          {/* View Mode Toggle from Explore(1) */}
          <div className="flex gap-2 p-1 bg-secondary rounded-lg">
            <Button
              variant={viewMode === "restaurants" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("restaurants")}
              className="flex-1"
            >
              <Utensils className="w-4 h-4 mr-2" />
              Restaurants
            </Button>
            <Button
              variant={viewMode === "events" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("events")}
              className="flex-1"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </Button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={viewMode === "restaurants" ? "Search restaurants, cuisines..." : "Search events, venues..."}
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
        {viewMode === "restaurants" ? (
          <>
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
                {filteredRestaurants.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    layout
                     {...({} as any)}
                  >
                    <RestaurantCard {...r} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {!isLoading && filteredRestaurants.length === 0 && (
              <div className="text-center py-16">
                <Search className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-bold text-lg">No restaurants found</h3>
                <p className="text-muted-foreground text-sm">Try adjusting your filters.</p>
              </div>
            )}
          </>
        ) : (
          <ExploreEvents searchQuery={searchQuery} location={location} />
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Explore;

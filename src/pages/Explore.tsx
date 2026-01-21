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
/* RAW DATABASE TYPE (matches Supabase table) */
/* ------------------------------------------------------------------ */
interface RestaurantDBRow {
  id: string;
  name: string;
  cuisine: string | null;
  city: string | null;
  image_url: string | null;
  rating: number | null;
  discount: number | null;
  is_popular: boolean | null;
  distance: number | null;

  // extra fields from DB (ignored by UI)
  address?: string;
  email?: string;
  upi_id?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  created_at?: string;
}

/* ------------------------------------------------------------------ */
/* UI-SAFE TYPE (what the UI actually uses) */
/* ------------------------------------------------------------------ */
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

const Explore = () => {
  const [restaurants, setRestaurants] = useState<RestaurantUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [location, setLocation] = useState("Jhansi");
  const [isLocating, setIsLocating] = useState(false);

  /* ---------------------------------------------------------------- */
  /* Fetch + Normalize */
  /* ---------------------------------------------------------------- */
  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*");

      if (error) throw error;

      const normalized: RestaurantUI[] = (data as RestaurantDBRow[]).map(
        (r) => ({
          id: r.id,
          name: r.name,
          cuisine: r.cuisine ?? "Multi-cuisine",
          distance: `${r.distance ?? 0} km`,
          rating: r.rating ?? 4.0,
          discount: r.discount ?? 0,
          imageUrl: r.image_url ?? "/images/restaurant-placeholder.jpg",
          isPopular: Boolean(r.is_popular),
        })
      );

      setRestaurants(normalized);
    } catch (err) {
      console.error("Failed to fetch restaurants:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ---------------------------------------------------------------- */
  /* Location (UI only) */
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
          setLocation(
            data.address?.city ||
              data.address?.town ||
              data.address?.district ||
              "Jhansi"
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

  /* ---------------------------------------------------------------- */
  /* Filters */
  /* ---------------------------------------------------------------- */
  const filteredRestaurants = restaurants.filter((r) => {
    const q = searchQuery.toLowerCase();
    const name = r.name.toLowerCase();
    const cuisine = r.cuisine.toLowerCase();
    const distanceVal = Number(r.distance.replace(" km", ""));

    if (!name.includes(q) && !cuisine.includes(q)) return false;

    switch (activeFilter) {
      case "popular":
        return r.isPopular;
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" />
              <Input
                placeholder="Search restaurants, cuisines..."
                className="pl-10"
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
          <AnimatePresence>
            {filteredRestaurants.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <RestaurantCard {...r} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Explore;

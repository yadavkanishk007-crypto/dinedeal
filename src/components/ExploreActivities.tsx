import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Gamepad, MapPin, Star, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ExploreActivitiesProps {
  searchQuery: string;
  location: string;
}

interface ActivityVenue {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  city: string;
  rating: number | null;
  image_url: string | null;
  discount: number;
}

export default function ExploreActivities({ searchQuery, location }: ExploreActivitiesProps) {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityVenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      // Entire chain cast to 'any' to bypass TS SelectQueryError depth limit
      const { data, error } = await (supabase as any)
        .from("restaurants")
        .select(`
          *,
          offers (
            discount_percent,
            is_active
          )
        `)
        .eq("is_approved", true)
        .eq("is_active", true)
        .eq("organiser_type", "activity_provider");

      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];
      const normalized: ActivityVenue[] = rows.map((row: any) => {
        const activeOffers = row.offers?.filter((offer: any) => String(offer.is_active) === "true") || [];
        const highestDiscount = activeOffers.length > 0 
          ? Math.max(...activeOffers.map((o: any) => Number(o.discount_percent || 0)))
          : 0;

        return {
          id: String(row.id),
          name: String(row.name ?? "Unnamed Venue"),
          cuisine: String(row.cuisine ?? "Activity"),
          address: String(row.address ?? ""),
          city: String(row.city ?? ""),
          rating: row.rating ? Number(row.rating) : null,
          image_url: row.image_url,
          discount: highestDiscount,
        };
      });

      setActivities(normalized);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter((activity) => {
    // Filter by location city
    if (location && activity.city && !activity.city.toLowerCase().includes(location.toLowerCase())) {
      return false;
    }

    const q = searchQuery.toLowerCase();
    const name = activity.name.toLowerCase();
    const cuisine = activity.cuisine.toLowerCase();
    const address = activity.address.toLowerCase();
    
    return name.includes(q) || cuisine.includes(q) || address.includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (filteredActivities.length === 0) {
    return (
      <motion.div
        className="text-center py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Gamepad className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-display font-bold text-lg text-foreground mb-2">
          No activities found
        </h3>
        <p className="text-muted-foreground text-sm">
          {location?.toLowerCase() !== "jhansi"
            ? "DineDeal is currently serviceable only in Jhansi."
            : "Check back later for newly added play areas, turfs, and arcades"}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div className="grid gap-4" layout>
      <AnimatePresence mode="popLayout">
        {filteredActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            layout
          >
            <Card
              className="overflow-hidden border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/restaurant/${activity.id}`)}
            >
              <CardContent className="p-0">
                <div className="flex">
                  {/* Activity Image */}
                  <div className="w-28 sm:w-36 shrink-0 relative">
                    {activity.image_url ? (
                      <img
                        src={activity.image_url}
                        alt={activity.name}
                        className="w-full h-full object-cover aspect-square"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center aspect-square">
                        <Gamepad className="w-8 h-8 text-primary/40" />
                      </div>
                    )}
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground line-clamp-2">
                        {activity.name}
                      </h3>
                      {activity.discount > 0 && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary shrink-0">
                          {activity.discount}% OFF
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <p className="font-medium text-xs text-primary/80 uppercase tracking-wider">
                        {activity.cuisine}
                      </p>
                      
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span className="truncate">
                          {activity.address || activity.city}
                        </span>
                      </p>
                      
                      {activity.rating && (
                        <p className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-foreground">{activity.rating}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

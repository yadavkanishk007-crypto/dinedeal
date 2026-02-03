import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, MapPin, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface FavoriteRestaurant {
  id: string;
  restaurant: {
    id: string;
    name: string;
    cuisine: string;
    address: string;
    image_url: string | null;
    rating: number | null;
  };
}

const FavoriteRestaurants = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchFavorites = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          restaurant:restaurants (
            id,
            name,
            cuisine,
            address,
            image_url,
            rating
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) {
        setFavorites(data as unknown as FavoriteRestaurant[]);
      } else {
        console.error("Error fetching favorites:", error);
      }

      setLoading(false);
    };

    fetchFavorites();
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <motion.header
        className="sticky top-0 z-40 glass border-b border-border/30"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="container py-4 flex items-center gap-4">
          <motion.button
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="font-display font-bold text-lg text-foreground">Favorite Restaurants</h1>
        </div>
      </motion.header>

      <main className="container py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border/50 animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl bg-secondary" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-secondary rounded w-3/4" />
                      <div className="h-3 bg-secondary rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="font-display font-bold text-xl text-foreground mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-6 max-w-xs">
              Start exploring restaurants and save your favorites for quick access
            </p>
            <Button onClick={() => navigate("/explore")} className="gradient-primary">
              Explore Restaurants
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {favorites.map((fav, index) => (
              <motion.div
                key={fav.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => navigate(`/restaurant/${fav.restaurant.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={fav.restaurant.image_url || "/placeholder.svg"}
                        alt={fav.restaurant.name}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{fav.restaurant.name}</h3>
                        <p className="text-sm text-muted-foreground">{fav.restaurant.cuisine}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{fav.restaurant.address}</span>
                        </div>
                        {fav.restaurant.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 fill-primary text-primary" />
                            <span className="text-xs text-foreground">{fav.restaurant.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default FavoriteRestaurants;

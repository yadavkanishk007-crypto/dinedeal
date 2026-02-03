import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Star, 
  Percent, 
  ChevronRight,
  Heart,
  Share2,
  Info,
  CalendarDays,
  UtensilsCrossed,
  Wallet 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import TableBookingModal from "@/components/TableBookingModal";
import RestaurantGallery from "@/components/RestaurantGallery";
import { useAuth } from "@/hooks/use-auth"; 

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  description: string | null;
  address: string;
  city: string;
  open_hours: string | null;
  rating: number | null;
  image_url: string | null;
}

interface Offer {
  id: string;
  title: string;
  discount_percent: number;
  max_discount: number;
  terms: string | null;
  valid_until: string | null;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  is_veg: boolean;
  is_available: boolean;
}

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRestaurantData();
    }
  }, [id, user]);

  const fetchRestaurantData = async () => {
    try {
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", id)
        .eq("is_approved", true)
        .eq("is_active", true)
        .maybeSingle();

      if (restaurantError) throw restaurantError;

      if (restaurantData) {
        setRestaurant(restaurantData);

        // SYNC FAVORITE STATE
        if (user) {
          const { data: favData } = await supabase
            .from("favorites")
            .select("id")
            .eq("user_id", user.id)
            .eq("restaurant_id", restaurantData.id)
            .maybeSingle();

          setIsFavorite(!!favData);
        }

        const { data: offersData } = await supabase
          .from("offers")
          .select("*")
          .eq("restaurant_id", id)
          .eq("is_active", true);

        setOffers(offersData || []);

        const { data: menuData } = await supabase
          .from("menu_items")
          .select("*")
          .eq("restaurant_id", id)
          .eq("is_available", true)
          .order("category");

        setMenuItems(menuData || []);
      }
    } catch (error) {
      console.error("Error fetching restaurant:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !restaurant) return;

    try {
      if (isFavorite) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("restaurant_id", restaurant.id);
        setIsFavorite(false);
      } else {
        await supabase.from("favorites").insert({
          user_id: user.id,
          restaurant_id: restaurant.id,
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full gradient-primary animate-pulse" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Restaurant not found</p>
      </div>
    );
  }

  const maxDiscount = offers.length > 0 
    ? Math.max(...offers.map(o => o.max_discount))
    : 0;

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="min-h-screen bg-background pb-[calc(100px+env(safe-area-inset-bottom))]">
      <div className="relative">
        <motion.div className="h-72 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <img
            src={restaurant.image_url || "/placeholder.svg"}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </motion.div>

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <motion.button
            className="w-10 h-10 rounded-full glass flex items-center justify-center"
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <div className="flex gap-2">
            
            <motion.button 
              className="w-10 h-10 rounded-full glass flex items-center justify-center" 
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                if (navigator.share) {
                  await navigator.share({
                    title: restaurant.name,
                    text: `Check out ${restaurant.name} on DineDeal`,
                    url: window.location.href,
                  });
                } else {
                  await navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard");
                }
              }}
            >
              <Share2 className="w-5 h-5 text-foreground" />
            </motion.button>

            <motion.button
              className="w-10 h-10 rounded-full glass flex items-center justify-center"
              onClick={toggleFavorite}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? "fill-primary text-primary" : "text-foreground"}`} />
            </motion.button>
          </div>
        </div>
      </div>

      <main className="container -mt-12 relative z-10 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground mb-1">{restaurant.name}</h1>
                  <p className="text-muted-foreground text-sm">{restaurant.cuisine}</p>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success/10">
                  <Star className="w-4 h-4 text-success fill-success" />
                  <span className="font-semibold text-success">
                    {restaurant.rating && restaurant.rating > 0 ? restaurant.rating.toFixed(1) : "New"}
                  </span>
                </div>
              </div>

              {restaurant.description && (
                <p className="text-muted-foreground text-sm mt-4 leading-relaxed">{restaurant.description}</p>
              )}

              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{restaurant.city}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{restaurant.open_hours || "11:00 AM - 11:00 PM"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.05 }}
          className="space-y-3"
        >
          {maxDiscount > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium bg-primary/5 py-1.5 rounded-full border border-primary/10">
               <Percent className="w-4 h-4" /> 
               Save up to ₹{maxDiscount} on this booking
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3">
             <Button
                variant="outline"
                size="lg"
                className="w-full border-primary/20 hover:bg-primary/5 text-foreground h-12"
                onClick={() => setShowBookingModal(true)}
              >
                <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                Book Table
              </Button>

              <Button
                variant="default" 
                size="lg"
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                onClick={() => navigate(`/pay?restaurant=${restaurant.id}`)}
              >
                <Wallet className="w-4 h-4 mr-2" />
                Pay Now
              </Button>
          </div>
        </motion.div>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="font-display font-bold text-lg text-foreground mb-4">Active Offers</h2>
          {offers.length > 0 ? (
            <div className="space-y-3">
              {offers.map((offer, index) => (
                <motion.div key={offer.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + index * 0.05 }}>
                  <Card className="border-primary/20 bg-primary/5 overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                              <Percent className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{offer.title}</h3>
                              <p className="text-xs text-muted-foreground">
                                Max ₹{offer.max_discount} off
                                {offer.valid_until && ` • Valid till ${new Date(offer.valid_until).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`}
                              </p>
                            </div>
                          </div>
                          {offer.terms && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                              <Info className="w-3 h-3" />
                              <span>{offer.terms}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-display font-bold gradient-text">{offer.discount_percent}%</span>
                          <p className="text-xs text-muted-foreground">OFF</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="border-border/50 border-dashed">
              <CardContent className="p-6 text-center">
                <Percent className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-20" />
                <p className="text-muted-foreground text-sm">No exclusive offers available today.</p>
              </CardContent>
            </Card>
          )}
        </motion.section>

        {menuItems.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-primary" /> Menu
            </h2>
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-4">
                {Object.entries(groupedMenuItems).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">{category}</h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-start justify-between p-3 rounded-lg bg-secondary/50">
                          <div className="flex items-start gap-2">
                            <div className={`w-4 h-4 mt-1 rounded-sm border-2 flex items-center justify-center shrink-0 ${item.is_veg ? "border-success" : "border-destructive"}`}>
                              <div className={`w-2 h-2 rounded-full ${item.is_veg ? "bg-success" : "bg-destructive"}`} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                            </div>
                          </div>
                          <span className="font-bold text-sm">₹{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.section>
        )}

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <RestaurantGallery restaurantId={restaurant.id} />
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Address</p>
                    <p className="text-xs text-muted-foreground">{restaurant.address}, {restaurant.city}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </main>

      <TableBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
      />
      <BottomNav />
    </div>
  );
};

export default RestaurantDetail;

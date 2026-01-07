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
  Leaf
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { restaurants as mockRestaurants } from "@/data/mockData";
import TableBookingModal from "@/components/TableBookingModal";
import RestaurantGallery from "@/components/RestaurantGallery";

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
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      // Fetch restaurant
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

        // Fetch offers for this restaurant
        const { data: offersData } = await supabase
          .from("offers")
          .select("*")
          .eq("restaurant_id", id)
          .eq("is_active", true);

        setOffers(offersData || []);

        // Fetch menu items
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

  // Fallback to mock data for demo
  const mockRestaurant = mockRestaurants.find((r) => r.id === id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full gradient-primary animate-pulse" />
      </div>
    );
  }

  // Use real data if available, otherwise fallback to mock
  const displayRestaurant = restaurant || (mockRestaurant ? {
    id: mockRestaurant.id,
    name: mockRestaurant.name,
    cuisine: mockRestaurant.cuisine,
    description: mockRestaurant.description,
    address: mockRestaurant.address,
    city: "Jhansi",
    open_hours: mockRestaurant.openHours,
    rating: mockRestaurant.rating,
    image_url: mockRestaurant.imageUrl,
  } : null);

  if (!displayRestaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Restaurant not found</p>
      </div>
    );
  }

  const maxDiscount = offers.length > 0 
    ? Math.max(...offers.map(o => o.max_discount))
    : 500;

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero Image */}
      <div className="relative">
        <motion.div
          className="h-72 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <img
            src={displayRestaurant.image_url || "/placeholder.svg"}
            alt={displayRestaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </motion.div>

        {/* Back Button & Actions */}
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
            >
              <Share2 className="w-5 h-5 text-foreground" />
            </motion.button>
            <motion.button
              className="w-10 h-10 rounded-full glass flex items-center justify-center"
              onClick={() => setIsFavorite(!isFavorite)}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? "fill-primary text-primary" : "text-foreground"}`} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container -mt-12 relative z-10 space-y-6">
        {/* Restaurant Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                    {displayRestaurant.name}
                  </h1>
                  <p className="text-muted-foreground text-sm">{displayRestaurant.cuisine}</p>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success/10">
                  <Star className="w-4 h-4 text-success fill-success" />
                  <span className="font-semibold text-success">{displayRestaurant.rating || 4.5}</span>
                </div>
              </div>

              {displayRestaurant.description && (
                <p className="text-muted-foreground text-sm mt-4 leading-relaxed">
                  {displayRestaurant.description}
                </p>
              )}

              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{displayRestaurant.city}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{displayRestaurant.open_hours || "11:00 AM - 11:00 PM"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Offers */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="font-display font-bold text-lg text-foreground mb-4">
            Active Offers
          </h2>
          {offers.length > 0 ? (
            <div className="space-y-3">
              {offers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
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
                          <span className="text-2xl font-display font-bold gradient-text">
                            {offer.discount_percent}%
                          </span>
                          <p className="text-xs text-muted-foreground">OFF</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="border-border/50">
              <CardContent className="p-6 text-center">
                <Percent className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No active offers at the moment</p>
              </CardContent>
            </Card>
          )}
        </motion.section>

        {/* Menu Section */}
        {menuItems.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
              Menu
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
                            <div className={`w-4 h-4 mt-1 rounded-sm border-2 flex items-center justify-center shrink-0 ${
                              item.is_veg ? "border-success" : "border-destructive"
                            }`}>
                              <div className={`w-2 h-2 rounded-full ${item.is_veg ? "bg-success" : "bg-destructive"}`} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                              )}
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

        {/* Photo Gallery */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <RestaurantGallery restaurantId={displayRestaurant.id} />
        </motion.section>

        {/* How it Works */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display font-bold text-lg text-foreground mb-4">
            How to Save
          </h2>
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-4">
              {[
                { step: 1, text: "Dine at the restaurant & get the bill" },
                { step: 2, text: "Open DineDeal and enter the bill amount" },
                { step: 3, text: "Pay via UPI and instantly save!" },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                    {item.step}
                  </div>
                  <p className="text-sm text-foreground">{item.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.section>

        {/* Address */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Address</p>
                    <p className="text-xs text-muted-foreground">{displayRestaurant.address}, {displayRestaurant.city}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </main>

      {/* Fixed Bottom CTA */}
      <motion.div
        className="fixed bottom-20 left-0 right-0 z-40 p-4"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="container max-w-lg mx-auto">
          <div className="glass rounded-2xl p-4 flex items-center justify-between gap-4 border border-border/30">
            <div>
              <p className="text-sm text-muted-foreground">You can save up to</p>
              <p className="text-xl font-display font-bold gradient-text">
                ₹{maxDiscount}
              </p>
            </div>
            <Button
              variant="secondary"
              size="lg"
              className="shrink-0"
              onClick={() => setShowBookingModal(true)}
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Book Table
            </Button>
            <Button
              variant="gradient"
              size="lg"
              className="shrink-0"
              onClick={() => navigate(`/pay?restaurant=${displayRestaurant.id}`)}
            >
              Pay Now
            </Button>
          </div>
        </div>
      </motion.div>

      <TableBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        restaurantId={displayRestaurant.id}
        restaurantName={displayRestaurant.name}
      />

      <BottomNav />
    </div>
  );
};

export default RestaurantDetail;

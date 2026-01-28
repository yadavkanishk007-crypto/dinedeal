import { motion } from "framer-motion";
import { MapPin, Star, Percent, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";

interface RestaurantCardProps {
  id: string;
  name: string;
  cuisine: string;
  distance: string;
  rating: number;
  discount: number;
  imageUrl: string;
  isPopular?: boolean;
}

const RestaurantCard = ({
  id,
  name,
  cuisine,
  distance,
  rating,
  discount,
  imageUrl,
  isPopular,
}: RestaurantCardProps) => {
  return (
    <Link to={`/restaurant/${id}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Card className="overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-lg group">
          <div className="relative">
            <div className="aspect-[16/10] overflow-hidden">
              <img
                src={imageUrl || "/placeholder.svg"} // Fallback for missing images
                alt={name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            
            {/* Discount Badge */}
            <div className="absolute top-3 left-3">
              <motion.div
                className="gradient-primary px-3 py-1.5 rounded-full flex items-center gap-1 shadow-coral"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Percent className="w-3.5 h-3.5 text-primary-foreground" />
                <span className="text-xs font-bold text-primary-foreground">
                  {discount}% OFF
                </span>
              </motion.div>
            </div>

            {/* Popular Badge */}
            {isPopular && (
              <div className="absolute top-3 right-3">
                <div className="gradient-gold px-2.5 py-1 rounded-full">
                  <span className="text-xs font-semibold text-primary-foreground">
                    Popular
                  </span>
                </div>
              </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent" />
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-foreground truncate text-lg">
                  {name}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {cuisine}
                </p>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10">
                <Star className="w-3.5 h-3.5 text-success fill-success" />
                <span className="text-sm font-semibold text-success">
                  {/* UPDATED: Displays "New" if rating is 0 or null, matching RestaurantDetail */}
                  {rating && rating > 0 ? rating.toFixed(1) : "New"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-xs">{distance}</span>
              </div>
              <div className="flex items-center gap-1 text-primary font-medium text-sm">
                <span>Pay & Save</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
};

export default RestaurantCard;

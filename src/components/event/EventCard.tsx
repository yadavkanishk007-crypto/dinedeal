import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Users, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface EventCardProps {
  id: string;
  title: string;
  description?: string;
  cover_image?: string;
  event_date: string;
  start_time: string;
  city: string;
  venue_name: string;
  is_paid: boolean;
  ticket_price: number;
  remaining_seats: number;
  total_seats: number;
  status: string;
  onClick?: () => void;
}

export default function EventCard({
  title,
  description,
  cover_image,
  event_date,
  start_time,
  city,
  venue_name,
  is_paid,
  ticket_price,
  remaining_seats,
  total_seats,
  status,
  onClick,
}: EventCardProps) {
  const isSoldOut = remaining_seats === 0;
  const isLowStock = remaining_seats <= 10 && remaining_seats > 0;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="bg-card rounded-xl overflow-hidden border shadow-sm cursor-pointer group"
      onClick={onClick}
    >
      {/* Cover Image */}
      <div className="relative aspect-video bg-muted">
        {cover_image ? (
          <img
            src={cover_image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {is_paid ? (
            <Badge className="bg-primary text-primary-foreground">
              ₹{ticket_price}
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-green-500/90 text-white">
              Free
            </Badge>
          )}
          {status === 'draft' && (
            <Badge variant="outline" className="bg-background/80">
              Draft
            </Badge>
          )}
        </div>

        {/* Availability Badge */}
        {isSoldOut ? (
          <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground">
            Sold Out
          </Badge>
        ) : isLowStock ? (
          <Badge className="absolute top-3 right-3 bg-orange-500 text-white">
            Only {remaining_seats} left
          </Badge>
        ) : null}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-display font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{format(new Date(event_date), "EEE, MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>{formatTime(start_time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="line-clamp-1">{venue_name}, {city}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{remaining_seats}/{total_seats} seats</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-primary">
            <Ticket className="w-4 h-4" />
            <span>Book Now</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
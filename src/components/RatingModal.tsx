import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Utensils, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id: string;
    restaurant_id: string | null;
    restaurants?: {
      name: string;
    };
  };
  onRatingSubmitted: (transactionId: string) => void;
}

const RatingModal = ({ isOpen, onClose, transaction, onRatingSubmitted }: RatingModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [diningRating, setDiningRating] = useState(0);
  const [appRating, setAppRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoveredDining, setHoveredDining] = useState(0);
  const [hoveredApp, setHoveredApp] = useState(0);

  const handleSubmit = async () => {
    if (!user || diningRating === 0) {
      toast({
        title: "Rating required",
        description: "Please rate your dining experience",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("ratings").insert({
        user_id: user.id,
        restaurant_id: transaction.restaurant_id,
        transaction_id: transaction.id,
        dining_rating: diningRating,
        app_rating: appRating || null,
        feedback: feedback.trim() || null,
      });

      if (error) throw error;

      onRatingSubmitted(transaction.id);
    } catch (error: any) {
      console.error("Rating error:", error);
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ 
    value, 
    onChange, 
    hovered, 
    onHover 
  }: { 
    value: number; 
    onChange: (v: number) => void; 
    hovered: number; 
    onHover: (v: number) => void;
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          type="button"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onMouseEnter={() => onHover(star)}
          onMouseLeave={() => onHover(0)}
          onClick={() => onChange(star)}
          className="p-1"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= (hovered || value)
                ? "text-gold fill-gold"
                : "text-muted-foreground"
            }`}
          />
        </motion.button>
      ))}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
            initial={{ opacity: 0, scale: 0.95, y: "-40%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, y: "-40%" }}
          >
            <Card className="border-border/50 shadow-xl">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display font-bold text-lg text-foreground">
                    Rate Your Experience
                  </h2>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  How was your experience at {transaction.restaurants?.name || "the restaurant"}?
                </p>

                {/* Dining Rating */}
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Utensils className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">Dining Experience</span>
                      <span className="text-destructive">*</span>
                    </div>
                    <StarRating
                      value={diningRating}
                      onChange={setDiningRating}
                      hovered={hoveredDining}
                      onHover={setHoveredDining}
                    />
                  </div>

                  {/* App Rating */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Smartphone className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">App Experience</span>
                      <span className="text-xs text-muted-foreground">(optional)</span>
                    </div>
                    <StarRating
                      value={appRating}
                      onChange={setAppRating}
                      hovered={hoveredApp}
                      onHover={setHoveredApp}
                    />
                  </div>
                </div>

                {/* Feedback */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Additional Feedback
                  </label>
                  <Textarea
                    placeholder="Tell us more about your experience..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={submitting || diningRating === 0}
                >
                  {submitting ? "Submitting..." : "Submit Rating"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RatingModal;
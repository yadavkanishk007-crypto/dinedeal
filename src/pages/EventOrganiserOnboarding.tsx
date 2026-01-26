import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Link2, Instagram, Twitter, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";

interface FormData {
  groupName: string;
  description: string;
  city: string;
  phone: string;
  email: string;
  instagram: string;
  twitter: string;
  website: string;
}

const EventOrganiserOnboarding = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    groupName: "",
    description: "",
    city: "Jhansi",
    phone: "",
    email: "",
    instagram: "",
    twitter: "",
    website: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Create event organiser entry in restaurants table
      const { error } = await supabase
        .from("restaurants")
        .insert({
          owner_id: user.id,
          name: formData.groupName,
          description: formData.description,
          cuisine: "Events", // Placeholder for event organisers
          address: formData.city, // Using city as address for organisers
          city: formData.city,
          phone: formData.phone,
          email: formData.email,
          is_active: false,
          is_approved: false,
          is_event_organiser: true,
          organiser_type: "event_group",
        });

      if (error) throw error;

      toast({
        title: "Welcome aboard! 🎉",
        description: "Your organiser profile is pending approval. We'll notify you soon.",
      });

      navigate("/restaurant-dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="container py-4 flex items-center justify-between">
          <motion.button
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <Logo />
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container max-w-lg py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Hero Section */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Set Up Your Organiser Profile
            </h1>
            <p className="text-muted-foreground mt-2">
              Create events and sell tickets to your audience
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Basic Information</h3>
              
              <Input
                placeholder="Group/Brand Name *"
                value={formData.groupName}
                onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                required
                className="bg-secondary border-transparent"
              />
              
              <Textarea
                placeholder="About your group/brand (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="bg-secondary border-transparent"
              />
              
              <Input
                placeholder="City *"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                className="bg-secondary border-transparent"
              />
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Contact Details</h3>
              
              <Input
                type="email"
                placeholder="Contact Email *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-secondary border-transparent"
              />
              
              <Input
                type="tel"
                placeholder="Contact Phone *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="bg-secondary border-transparent"
              />
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Social Links (Optional)
              </h3>
              
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Instagram handle"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  className="pl-10 bg-secondary border-transparent"
                />
              </div>
              
              <div className="relative">
                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Twitter/X handle"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  className="pl-10 bg-secondary border-transparent"
                />
              </div>
              
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Website URL"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="pl-10 bg-secondary border-transparent"
                />
              </div>
            </div>

            {/* Note */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Note:</strong> Your profile will be reviewed by our team before you can publish events. This usually takes 24-48 hours.
              </p>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="gradient"
              size="xl"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Creating Profile..." : "Create Organiser Profile"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default EventOrganiserOnboarding;

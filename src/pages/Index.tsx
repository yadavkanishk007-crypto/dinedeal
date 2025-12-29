import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, Sparkles, TrendingUp, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import RestaurantCard from "@/components/RestaurantCard";
import QuickStats from "@/components/QuickStats";
import FilterChips from "@/components/FilterChips";
import BottomNav from "@/components/BottomNav";
import { restaurants } from "@/data/mockData";
import heroIllustration from "@/assets/hero-illustration.png";

const filters = [
  { id: "all", label: "All" },
  { id: "popular", label: "🔥 Popular" },
  { id: "nearby", label: "📍 Nearby" },
  { id: "high-discount", label: "💰 High Savings" },
  { id: "cafe", label: "☕ Cafes" },
  { id: "fine-dining", label: "🍷 Fine Dining" },
];

const Index = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoggedIn] = useState(true); // For demo, user is logged in

  const filteredRestaurants = restaurants.filter((r) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "popular") return r.isPopular;
    if (activeFilter === "nearby") return parseFloat(r.distance) < 2;
    if (activeFilter === "high-discount") return r.discount >= 20;
    if (activeFilter === "cafe") return r.cuisine.toLowerCase().includes("cafe");
    if (activeFilter === "fine-dining") return r.cuisine.toLowerCase().includes("fine dining");
    return true;
  });

  if (!isLoggedIn) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-40 glass border-b border-border/30"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo size="default" />
              <div className="h-6 w-px bg-border" />
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Bangalore</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            <Link to="/profile">
              <motion.div
                className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                A
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="container py-6 space-y-6">
        {/* Quick Stats Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-foreground">Your Savings</h2>
            <Link to="/rewards" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <QuickStats />
        </motion.section>

        {/* Featured Offer */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="relative overflow-hidden rounded-3xl gradient-primary p-6 text-primary-foreground"
            whileHover={{ scale: 1.01 }}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary-foreground/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium opacity-90">Weekend Special</span>
              </div>
              <h3 className="font-display text-2xl font-bold mb-2">
                Extra 10% Cashback
              </h3>
              <p className="text-sm opacity-80 mb-4">
                Pay at any restaurant this weekend and get extra cashback!
              </p>
              <Button variant="glass" size="sm" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/30">
                Claim Now
              </Button>
            </div>
          </motion.div>
        </motion.section>

        {/* Restaurants Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-foreground">Nearby Restaurants</h2>
            <Link to="/explore" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              See All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <FilterChips
            filters={filters}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          <motion.div
            className="grid gap-4 mt-4"
            layout
          >
            <AnimatePresence mode="popLayout">
              {filteredRestaurants.map((restaurant, index) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <RestaurantCard {...restaurant} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredRestaurants.length === 0 && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-muted-foreground">No restaurants found for this filter.</p>
            </motion.div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

// Landing Page for non-logged-in users
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container py-6 flex items-center justify-between">
        <Logo size="lg" />
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/auth">
            <Button variant="gradient">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container py-12 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Users saved ₹2.5 Cr this month</span>
            </motion.div>

            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6">
              Dine Local.{" "}
              <span className="gradient-text">Save More.</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Pay at your favorite restaurants through Zave and get instant discounts, 
              cashback, and exclusive rewards. Start saving on every meal today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
                <Button variant="gradient" size="xl" className="w-full sm:w-auto">
                  Start Saving Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/explore">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  Explore Restaurants
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-8 mt-10 pt-10 border-t border-border">
              <div>
                <p className="font-display text-3xl font-bold text-foreground">500+</p>
                <p className="text-sm text-muted-foreground">Restaurants</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="font-display text-3xl font-bold text-foreground">50K+</p>
                <p className="text-sm text-muted-foreground">Happy Users</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <p className="font-display text-3xl font-bold gradient-text">₹2.5 Cr</p>
                <p className="text-sm text-muted-foreground">Total Saved</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative">
              <motion.img
                src={heroIllustration}
                alt="Zave rewards illustration"
                className="w-full max-w-lg mx-auto"
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              />
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-primary/20 blur-3xl rounded-full" />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Index;

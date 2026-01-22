import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  User, 
  Heart, 
  CreditCard, 
  Bell, 
  HelpCircle, 
  Headphones,
  LogOut,
  ChevronRight,
  TrendingUp,
  Shield,
  Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import NotificationSettings from "@/components/NotificationSettings";

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState({
    totalTransactions: 0,
    lifetimeSavings: 0,
    favoriteRestaurants: 0,
  });

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      const { data: txData } = await supabase
        .from("transactions")
        .select("discount_amount")
        .eq("user_id", user.id)
        .eq("payment_status", "completed");

      if (txData) {
        setStats({
          totalTransactions: txData.length,
          lifetimeSavings: txData.reduce((sum, t) => sum + Number(t.discount_amount), 0),
          favoriteRestaurants: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const menuItems = [
    { icon: Receipt, label: "Transaction History", value: `${stats.totalTransactions} payments`, path: "/transactions" },
    { icon: Heart, label: "Favorite Restaurants", value: `${stats.favoriteRestaurants} saved`, path: "/favorites" },
    { icon: CreditCard, label: "Payment Methods", value: "UPI linked", path: "/payments" },
    { icon: Headphones, label: "Customer Support", value: "Get help", path: "/support" },
    { icon: Shield, label: "Privacy & Security", value: "", path: "/security" },
    { icon: HelpCircle, label: "FAQs", value: "", path: "/help" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
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
          <h1 className="font-display font-bold text-lg text-foreground">Profile</h1>
        </div>
      </motion.header>

      <main className="container py-6 space-y-6">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground">
                  <User className="w-10 h-10" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display font-bold text-xl text-foreground">
                    {user?.email?.split("@")[0] || "User"}
                  </h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lifetime Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="overflow-hidden border-0">
            <div className="gradient-warm p-6 text-primary-foreground">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">Lifetime Savings</span>
              </div>
              <p className="text-4xl font-display font-bold">₹{stats.lifetimeSavings.toLocaleString()}</p>
              <p className="text-sm opacity-80 mt-2">Across {stats.totalTransactions} transactions</p>
            </div>
          </Card>
        </motion.div>

        {/* Push Notifications */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <NotificationSettings />
        </motion.div>

        {/* Menu Items */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
          {menuItems.map((item, index) => (
            <motion.div key={item.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + index * 0.05 }}>
              <Card className="border-border/50 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(item.path)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{item.label}</p>
                      {item.value && <p className="text-xs text-muted-foreground">{item.value}</p>}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Logout Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Button variant="outline" className="w-full border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => signOut()}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </motion.div>

        <motion.p className="text-center text-xs text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
           DineDeal © 2026
        </motion.p>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;

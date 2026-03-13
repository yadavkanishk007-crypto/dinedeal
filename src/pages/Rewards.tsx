import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Gift, Wallet, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Transaction {
  id: string;
  bill_amount: number;
  discount_amount: number;
  final_amount: number;
  rewards_earned: number;
  created_at: string;
  payment_status: string;
  restaurant_id: string;
}

interface UserStats {
  totalSaved: number;
  rewardPoints: number;
  totalTransactions: number;
  redeemableAmount: number;
  lifetimeSavings: number;
}

const Rewards = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalSaved: 0,
    rewardPoints: 0,
    totalTransactions: 0,
    redeemableAmount: 0,
    lifetimeSavings: 0,
  });
  const [restaurantNames, setRestaurantNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch transactions
      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user?.id)
        .eq("payment_status", "completed")
        .order("created_at", { ascending: false });

      setTransactions(txData || []);

      // Get unique restaurant IDs and fetch their names
      const restaurantIds = [...new Set((txData || []).map(tx => tx.restaurant_id).filter(Boolean))];
      if (restaurantIds.length > 0) {
        const { data: restaurants } = await supabase
          .from("restaurants")
          .select("id, name")
          .in("id", restaurantIds);

        const names: Record<string, string> = {};
        restaurants?.forEach(r => {
          names[r.id] = r.name;
        });
        setRestaurantNames(names);
      }

      // Fetch rewards natively from Supabase
      const { data: rewardsData, error: rewardsErr } = await supabase
        .from("user_reward_balance_view")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      // Calculate stats
      const totalSaved = (txData || []).reduce((sum, tx) => sum + Number(tx.discount_amount), 0);

      setUserStats({
        totalSaved,
        rewardPoints: rewardsData?.points || 0,
        totalTransactions: txData?.length || 0,
        redeemableAmount: rewardsData?.redeemable_amount || 0,
        lifetimeSavings: totalSaved,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full gradient-primary animate-pulse" />
      </div>
    );
  }

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
          <h1 className="font-display font-bold text-lg text-foreground">Rewards & Savings</h1>
        </div>
      </motion.header>

      <main className="container py-6 space-y-6">
        {/* Total Savings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden border-0">
            <div className="gradient-primary p-6 text-primary-foreground relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 opacity-90">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-medium">Total Savings This Month</span>
                </div>
                <p className="text-4xl font-display font-bold mb-4">
                  ₹{userStats.totalSaved.toLocaleString()}
                </p>
                <div className="flex gap-6">
                  <div>
                    <p className="text-sm opacity-80">Lifetime</p>
                    <p className="font-bold">₹{userStats.lifetimeSavings.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">Transactions</p>
                    <p className="font-bold">{userStats.totalTransactions}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Reward Points & Redeemable */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-gold/30 bg-gold/5 h-full">
              <CardContent className="p-4">
                <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center mb-3">
                  <Gift className="w-5 h-5 text-primary-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Reward Points</p>
                <p className="text-2xl font-display font-bold text-gold">{userStats.rewardPoints}</p>
                <p className="text-xs text-muted-foreground mt-1">Points</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-success/30 bg-success/5 h-full">
              <CardContent className="p-4">
                <div className="w-10 h-10 rounded-xl gradient-success flex items-center justify-center mb-3">
                  <Wallet className="w-5 h-5 text-success-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Redeemable</p>
                <p className="text-2xl font-display font-bold text-success">₹{userStats.redeemableAmount}</p>
                <Button variant="success" size="sm" className="mt-2 w-full text-xs h-8">
                  Redeem Now
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Transaction History */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-foreground">
              Transaction History
            </h2>
          </div>

          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                            <ArrowUpRight className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {restaurantNames[tx.restaurant_id] || "Restaurant"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">₹{tx.bill_amount}</p>
                          <p className="text-xs text-success font-medium">
                            Saved ₹{tx.discount_amount}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-success" />
                          Discount applied
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gold">
                          <Gift className="w-3 h-3" />
                          +{tx.rewards_earned || 0} points
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center">
                <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No transactions yet</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/explore")}>
                  Start Saving
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Rewards;

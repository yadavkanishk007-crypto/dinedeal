import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Receipt,
  Star,
  ChevronRight,
  Calendar,
  TrendingDown,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import RatingModal from "@/components/RatingModal";

interface Transaction {
  id: string;
  bill_amount: number;
  discount_amount: number;
  final_amount: number;
  rewards_earned: number;
  payment_status: string;
  payment_reference: string | null;
  created_at: string;
  restaurant_id: string | null;
  restaurants?: {
    name: string;
    cuisine: string;
    image_url: string | null;
  };
}

const TransactionHistory = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratedTransactions, setRatedTransactions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchTransactions();
      fetchRatedTransactions();
    }
  }, [user, authLoading, navigate]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          restaurants (
            name,
            cuisine,
            image_url
          )
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRatedTransactions = async () => {
    try {
      const { data } = await supabase
        .from("ratings")
        .select("transaction_id")
        .eq("user_id", user!.id);

      if (data) {
        setRatedTransactions(new Set(data.map(r => r.transaction_id).filter(Boolean)));
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  const handleRateTransaction = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setShowRatingModal(true);
  };

  const handleRatingSubmitted = (transactionId: string) => {
    setRatedTransactions(prev => new Set([...prev, transactionId]));
    setShowRatingModal(false);
    toast({
      title: "Thank you!",
      description: "Your rating has been submitted",
    });
  };

  const totalSavings = transactions.reduce((sum, tx) => sum + Number(tx.discount_amount), 0);
  const totalRewards = transactions.reduce((sum, tx) => {
    // If webhook hasn't processed it historically, estimate 2% for completed
    const earned = tx.rewards_earned || (tx.payment_status === "completed" ? Math.floor(tx.bill_amount * 0.02) : 0);
    return sum + earned;
  }, 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full gradient-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
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
          <h1 className="font-display font-bold text-lg text-foreground">Transaction History</h1>
        </div>
      </motion.header>

      <main className="container py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-success" />
                  <span className="text-xs text-muted-foreground">Total Saved</span>
                </div>
                <p className="text-2xl font-display font-bold text-success">
                  ₹{totalSavings.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-gold/30 bg-gold/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4 text-gold" />
                  <span className="text-xs text-muted-foreground">Rewards Earned</span>
                </div>
                <p className="text-2xl font-display font-bold text-gold">
                  {totalRewards.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            All Transactions
          </h2>

          {transactions.length > 0 ? (
            <AnimatePresence>
              {transactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-border/50 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex items-center gap-1 text-xs text-gold mb-2">
                          <Gift className="w-3 h-3" />
                          +{tx.rewards_earned || (tx.payment_status === "completed" ? Math.floor(tx.bill_amount * 0.02) : 0)} points
                        </div>
                        <div className="flex items-start justify-between">
                          <div className="flex gap-3">
                            {tx.restaurants?.image_url ? (
                              <img
                                src={tx.restaurants.image_url}
                                alt={tx.restaurants?.name}
                                className="w-12 h-12 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                                <Receipt className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-foreground">
                                {tx.restaurants?.name || "Restaurant"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {tx.restaurants?.cuisine}
                              </p>
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {new Date(tx.created_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-foreground">₹{tx.final_amount}</p>
                            <p className="text-xs text-success">-₹{tx.discount_amount} saved</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${tx.payment_status === "completed"
                              ? "bg-success/10 text-success"
                              : "bg-gold/10 text-gold"
                              }`}>
                              {tx.payment_status}
                            </span>
                          </div>
                        </div>

                        {/* Rate Button */}
                        {tx.payment_status === "completed" && !ratedTransactions.has(tx.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3 border-primary/30"
                            onClick={() => handleRateTransaction(tx)}
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Rate Your Experience
                          </Button>
                        )}

                        {ratedTransactions.has(tx.id) && (
                          <div className="mt-3 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Star className="w-4 h-4 text-gold fill-gold" />
                            <span>Rated</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions yet</p>
              <Button
                variant="gradient"
                className="mt-4"
                onClick={() => navigate("/explore")}
              >
                Explore Restaurants
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Rating Modal */}
      {selectedTransaction && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          transaction={selectedTransaction}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default TransactionHistory;
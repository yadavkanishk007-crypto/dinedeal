import { motion } from "framer-motion";
import { TrendingUp, Wallet, Receipt, Gift } from "lucide-react";

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  gradient?: string;
}

const StatsCard = ({ icon, label, value, subValue, gradient = "gradient-primary" }: StatsCardProps) => {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl p-4 glass border-border/30"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full ${gradient} opacity-10 blur-2xl`} />
      <div className="relative z-10">
        <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center mb-3`}>
          {icon}
        </div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-xl font-bold font-display text-foreground">{value}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
        )}
      </div>
    </motion.div>
  );
};

const QuickStats = () => {
  const stats = [
    {
      icon: <TrendingUp className="w-5 h-5 text-primary-foreground" />,
      label: "Total Saved",
      value: "₹2,450",
      subValue: "This month",
      gradient: "gradient-primary",
    },
    {
      icon: <Wallet className="w-5 h-5 text-primary-foreground" />,
      label: "Rewards",
      value: "320",
      subValue: "Points",
      gradient: "gradient-gold",
    },
    {
      icon: <Receipt className="w-5 h-5 text-primary-foreground" />,
      label: "Transactions",
      value: "12",
      subValue: "This month",
      gradient: "gradient-warm",
    },
    {
      icon: <Gift className="w-5 h-5 text-success-foreground" />,
      label: "Redeemable",
      value: "₹150",
      subValue: "Available",
      gradient: "gradient-success",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <StatsCard {...stat} />
        </motion.div>
      ))}
    </div>
  );
};

export default QuickStats;

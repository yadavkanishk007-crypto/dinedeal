import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Wallet, User, ScanLine } from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Explore", path: "/explore" },
  { icon: ScanLine, label: "Scan", path: "/scan", primary: true },
  { icon: Wallet, label: "Rewards", path: "/rewards" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <motion.nav
      className="neo-nav fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 pb-safe"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.primary) {
            return (
              <Link key={item.path} to={item.path} className="-mt-6">
                <motion.div
                  className="relative"
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-coral">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full gradient-primary opacity-50"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl ${isActive ? "neo-pressed" : ""}`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{
                    color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <span
                  className={`text-xs font-medium ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
                    layoutId="nav-indicator"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNav;

import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Logo = ({ size = "default" }: { size?: "default" | "lg" | "sm" }) => {
  const sizeClasses = {
    sm: "text-xl",
    default: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <Link to="/" className="flex items-center gap-1">
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <span className={`font-display font-bold ${sizeClasses[size]} gradient-text`}>
          Zave
        </span>
        <motion.div
          className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-gold"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </motion.div>
    </Link>
  );
};

export default Logo;

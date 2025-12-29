import { motion } from "framer-motion";

const LoadingSkeleton = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`animate-shimmer bg-muted rounded-xl ${className}`} />
  );
};

export const RestaurantCardSkeleton = () => {
  return (
    <motion.div
      className="rounded-2xl border border-border/50 overflow-hidden bg-card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <LoadingSkeleton className="aspect-[16/10]" />
      <div className="p-4 space-y-3">
        <LoadingSkeleton className="h-5 w-3/4" />
        <LoadingSkeleton className="h-4 w-1/2" />
        <div className="flex justify-between pt-3">
          <LoadingSkeleton className="h-4 w-20" />
          <LoadingSkeleton className="h-4 w-24" />
        </div>
      </div>
    </motion.div>
  );
};

export const StatsSkeleton = () => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/30 p-4 bg-card">
          <LoadingSkeleton className="w-10 h-10 rounded-xl mb-3" />
          <LoadingSkeleton className="h-3 w-16 mb-2" />
          <LoadingSkeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;

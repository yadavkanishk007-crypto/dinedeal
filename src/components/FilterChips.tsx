import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}

const FilterChip = ({ label, isActive, onClick, icon }: FilterChipProps) => {
  return (
    <motion.button
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
        isActive
          ? "neo-pressed gradient-primary text-primary-foreground"
          : "neo-raised bg-secondary text-secondary-foreground hover:bg-secondary/80"
      )}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
    >
      {icon}
      {label}
    </motion.button>
  );
};

interface FilterChipsProps {
  filters: { id: string; label: string; icon?: React.ReactNode }[];
  activeFilter: string;
  onFilterChange: (id: string) => void;
}

const FilterChips = ({ filters, activeFilter, onFilterChange }: FilterChipsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 -mx-4 px-4">
      {filters.map((filter, index) => (
        <motion.div
          key={filter.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <FilterChip
            label={filter.label}
            icon={filter.icon}
            isActive={activeFilter === filter.id}
            onClick={() => onFilterChange(filter.id)}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default FilterChips;

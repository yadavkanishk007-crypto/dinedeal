import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseRealtimeTransactionsOptions {
  restaurantId?: string;
  onNewTransaction?: (transaction: any) => void;
  enabled?: boolean;
}

export const useRealtimeTransactions = ({
  restaurantId,
  onNewTransaction,
  enabled = true,
}: UseRealtimeTransactionsOptions) => {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for notification sound
    audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQs0hLuqYlpwSJawsY5QJSZaqMnJqF0WBSu1/MmeSho9iLaZW1dwe9C+jDcXPZvI2LOQORMwrfeKbQhLsKJlYYe40sGBKhc6tcK/dkIlWsC+Zj9ihczCcjghNcPpnVsSS8KidU1lhbzTu4MsFD6ov6VsLjljw7VrQ2+Nx8V3NhUsoO2naQ5HvLKMZWh4scvEfSsZPp3H1MuoPC0xkN+3kT8EQ6+4glxqitDGhDMZOqDAvHM2K1a8vHE/aYzNyX45HjCZ6rSeEke3oXVZaoLP0r2EMhg5ormwajIrXMS8cT5licnGdjkfL5rrt50SRbaidlhqhNDSvYQwGDmjubFrMyxdw7xxP2mJyMV2OB8wm+u4nxJFtaJ2WGqE0NLBhDIYOaO6smszLVy7sXE/aIjGw3Y4IDCb67mfEkS0oXZYaYTP0sGEMhg5o7qyazMtXLuxcT9oiMbDdjggMJvruZ8SRLShdlhphM/SwYQyGDmjurJrMy1cu7FxP2iIxsN2OCAwnOu5nxJEtKF2WGmEz9LBhDIYOaO6sm");
    
    if (!enabled || !restaurantId) return;

    const channel = supabase
      .channel(`transactions-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const newTx = payload.new as any;
          
          // Play notification sound
          if (audioRef.current) {
            audioRef.current.play().catch(() => {
              // Audio play might fail without user interaction
            });
          }

          // Show toast notification
          toast({
            title: "💰 New Payment Received!",
            description: `₹${newTx.final_amount} received${newTx.payment_reference ? ` (Ref: ${newTx.payment_reference})` : ""}`,
          });

          // Call callback if provided
          if (onNewTransaction) {
            onNewTransaction(newTx);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, enabled, onNewTransaction, toast]);
};

export default useRealtimeTransactions;
import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNotificationSound } from "@/hooks/useNotificationSound";

interface UseOrderNotificationsOptions {
  restaurantId?: string;
  isAdmin?: boolean;
  onNewOrder?: (order: any) => void;
  enabled?: boolean;
  soundEnabled?: boolean;
}

export const useOrderNotifications = ({
  restaurantId,
  isAdmin = false,
  onNewOrder,
  enabled = true,
  soundEnabled = true,
}: UseOrderNotificationsOptions) => {
  const { toast } = useToast();
  const { playSound, initAudio } = useNotificationSound();

  // Show browser notification if permitted
  const showBrowserNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.png',
        badge: '/favicon.png',
      });
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Request notification permission
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (!enabled) return;

    // For admin: listen to all transactions
    // For restaurant: listen to specific restaurant transactions
    const filter = isAdmin 
      ? undefined 
      : restaurantId 
        ? `restaurant_id=eq.${restaurantId}` 
        : undefined;

    if (!isAdmin && !restaurantId) return;

    const channel = supabase
      .channel(isAdmin ? 'admin-transactions' : `restaurant-transactions-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          ...(filter && { filter }),
        },
        async (payload) => {
          const newTx = payload.new as any;
          
          // Play sound if enabled
          if (soundEnabled) {
            playSound();
          }
          
          // Fetch restaurant name for better notification
          let restaurantName = '';
          if (newTx.restaurant_id) {
            const { data: restaurant } = await supabase
              .from('restaurants')
              .select('name')
              .eq('id', newTx.restaurant_id)
              .single();
            restaurantName = restaurant?.name || '';
          }

          const notificationTitle = isAdmin 
            ? `💰 New Order at ${restaurantName}` 
            : '💰 New Payment Received!';
          
          const notificationBody = `₹${Number(newTx.final_amount).toLocaleString()} ${
            newTx.payment_method ? `via ${newTx.payment_method}` : ''
          }${newTx.payment_reference ? ` (Ref: ${newTx.payment_reference})` : ''}`;

          // Show toast notification
          toast({
            title: notificationTitle,
            description: notificationBody,
            duration: 5000,
          });

          // Show browser notification
          showBrowserNotification(notificationTitle, notificationBody);

          // Call callback if provided
          if (onNewOrder) {
            onNewOrder({ ...newTx, restaurantName });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, isAdmin, enabled, soundEnabled, onNewOrder, toast, playSound, showBrowserNotification]);

  return { requestPermission, initAudio };
};

export default useOrderNotifications;

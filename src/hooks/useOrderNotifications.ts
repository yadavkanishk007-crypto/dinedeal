import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseOrderNotificationsOptions {
  restaurantId?: string;
  isAdmin?: boolean;
  onNewOrder?: (order: any) => void;
  enabled?: boolean;
}

// Notification sound as base64 (short pleasant chime)
const NOTIFICATION_SOUND = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYb/////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tQZB0P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=";

export const useOrderNotifications = ({
  restaurantId,
  isAdmin = false,
  onNewOrder,
  enabled = true,
}: UseOrderNotificationsOptions) => {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteractedRef = useRef(false);

  // Initialize audio on user interaction
  const initAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(NOTIFICATION_SOUND);
      audioRef.current.volume = 0.7;
    }
    hasInteractedRef.current = true;
  }, []);

  // Play notification sound
  const playSound = useCallback(() => {
    if (audioRef.current && hasInteractedRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  }, []);

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
    // Add click listener to enable audio
    const handleClick = () => initAudio();
    document.addEventListener('click', handleClick, { once: true });
    
    // Request notification permission
    requestPermission();

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [initAudio, requestPermission]);

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
          
          // Play sound
          playSound();
          
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
  }, [restaurantId, isAdmin, enabled, onNewOrder, toast, playSound, showBrowserNotification]);

  return { requestPermission, initAudio };
};

export default useOrderNotifications;

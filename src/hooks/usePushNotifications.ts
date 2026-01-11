import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | "default";
  isLoading: boolean;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: "default",
    isLoading: true,
  });

  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
      
      if (!isSupported) {
        setState({
          isSupported: false,
          isSubscribed: false,
          permission: "default",
          isLoading: false,
        });
        return;
      }

      const permission = Notification.permission;
      let isSubscribed = false;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        isSubscribed = !!subscription;
      } catch (error) {
        console.error("Error checking push subscription:", error);
      }

      setState({
        isSupported: true,
        isSubscribed,
        permission,
        isLoading: false,
      });
    };

    checkSupport();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [state.isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !user) return false;

    try {
      // Request permission first if not granted
      if (Notification.permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        // Note: In production, you'd use a VAPID public key from your backend
        const vapidKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        });
      }

      // Store subscription in database
      const subscriptionJson = subscription.toJSON();
      const keys = subscriptionJson.keys || {};
      
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: keys.p256dh || '',
          auth: keys.auth || '',
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) {
        console.error("Error storing push subscription:", error);
      } else {
        console.log("Push subscription stored successfully");
      }
      
      setState((prev) => ({ ...prev, isSubscribed: true }));
      return true;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return false;
    }
  }, [state.isSupported, user, requestPermission]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !user) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Remove from database first
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint);
        
        await subscription.unsubscribe();
      }

      setState((prev) => ({ ...prev, isSubscribed: false }));
      return true;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      return false;
    }
  }, [state.isSupported, user]);

  // Send a local notification (useful for testing or immediate notifications)
  const sendLocalNotification = useCallback(async (title: string, options?: { body?: string; tag?: string; icon?: string; badge?: string; data?: Record<string, unknown> }) => {
    if (!state.isSupported || Notification.permission !== "granted") {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: options?.icon || "/icons/icon-192.png",
        badge: options?.badge || "/icons/icon-192.png",
        body: options?.body,
        tag: options?.tag,
        data: options?.data,
      });
      return true;
    } catch (error) {
      console.error("Error sending local notification:", error);
      return false;
    }
  }, [state.isSupported]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendLocalNotification,
  };
};

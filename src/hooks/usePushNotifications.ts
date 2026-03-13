import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  isLoading: boolean;
}

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export const usePushNotifications = () => {
  const { user } = useAuth();

  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: "default",
    isLoading: true,
  });

  // -----------------------------
  // INITIAL CHECK
  // -----------------------------
  useEffect(() => {
    const init = async () => {
      const supported =
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window;

      if (!supported) {
        setState({
          isSupported: false,
          isSubscribed: false,
          permission: "default",
          isLoading: false,
        });
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      setState({
        isSupported: true,
        isSubscribed: !!subscription,
        permission: Notification.permission,
        isLoading: false,
      });
    };

    init();
  }, []);

  // -----------------------------
  // REQUEST PERMISSION
  // -----------------------------
  const requestPermission = useCallback(async () => {
    if (!state.isSupported) return false;

    const permission = await Notification.requestPermission();
    setState((prev) => ({ ...prev, permission }));
    return permission === "granted";
  }, [state.isSupported]);

  // -----------------------------
  // SUBSCRIBE (FORCE CLEAN)
  // -----------------------------
  const subscribe = useCallback(async () => {
    if (!state.isSupported || !user) return false;

    try {
      if (Notification.permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      if (!VAPID_PUBLIC_KEY) {
        throw new Error("Missing VAPID public key");
      }

      const registration = await navigator.serviceWorker.ready;

      // 🔥 ALWAYS UNSUBSCRIBE FIRST (critical)
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
      }

      // 🔐 Create fresh subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      });

      const json = subscription.toJSON();

      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Invalid push subscription");
      }

      // 💾 Store in Supabase
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            user_id: user.id,
            endpoint: json.endpoint,
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
          },
          {
            onConflict: "user_id,endpoint",
          }
        );

      if (error) throw error;

      setState((prev) => ({ ...prev, isSubscribed: true }));
      return true;
    } catch (err) {
      console.error("❌ Push subscribe failed:", err);
      return false;
    }
  }, [state.isSupported, user, requestPermission]);

  // -----------------------------
  // UNSUBSCRIBE
  // -----------------------------
  const unsubscribe = useCallback(async () => {
    if (!state.isSupported || !user) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint);

        await subscription.unsubscribe();
      }

      setState((prev) => ({ ...prev, isSubscribed: false }));
      return true;
    } catch (err) {
      console.error("❌ Push unsubscribe failed:", err);
      return false;
    }
  }, [state.isSupported, user]);

  // -----------------------------
  // LOCAL TEST NOTIFICATION
  // -----------------------------
  const sendLocalNotification = useCallback(
    async (title: string, body?: string) => {
      if (!state.isSupported || Notification.permission !== "granted") {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
      });

      return true;
    },
    [state.isSupported]
  );

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendLocalNotification,
  };
};

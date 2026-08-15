import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PushNotifications } from "@capacitor/push-notifications";

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  isLoading: boolean;
}

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const isCapacitor = (window as any).Capacitor !== undefined;

const mapPermission = (status: string): NotificationPermission => {
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "default";
};

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
      if (isCapacitor) {
        try {
          const status = await PushNotifications.checkPermissions();
          setState({
            isSupported: true,
            isSubscribed: localStorage.getItem("push_subscribed") === "true",
            permission: mapPermission(status.receive),
            isLoading: false,
          });
        } catch (e) {
          console.warn("Failed checking native push permissions:", e);
          setState({
            isSupported: false,
            isSubscribed: false,
            permission: "default",
            isLoading: false,
          });
        }
        return;
      }

      // Web Push fallback
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

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        setState({
          isSupported: true,
          isSubscribed: !!subscription,
          permission: Notification.permission,
          isLoading: false,
        });
      } catch (e) {
        console.warn("Failed checking web push subscription:", e);
        setState({
          isSupported: true,
          isSubscribed: false,
          permission: Notification.permission,
          isLoading: false,
        });
      }
    };

    init();
  }, []);

  // -----------------------------
  // REQUEST PERMISSION
  // -----------------------------
  const requestPermission = useCallback(async () => {
    if (isCapacitor) {
      try {
        const status = await PushNotifications.requestPermissions();
        const granted = status.receive === "granted";
        setState((prev) => ({ ...prev, permission: mapPermission(status.receive) }));
        return granted;
      } catch (e) {
        console.error("Native requestPermission failed:", e);
        return false;
      }
    }

    if (!state.isSupported) return false;

    const permission = await Notification.requestPermission();
    setState((prev) => ({ ...prev, permission }));
    return permission === "granted";
  }, [state.isSupported]);

  // -----------------------------
  // SUBSCRIBE
  // -----------------------------
  const subscribe = useCallback(async () => {
    if (!state.isSupported || !user) return false;

    if (isCapacitor) {
      try {
        const granted = await requestPermission();
        if (!granted) return false;

        return new Promise<boolean>((resolve) => {
          // Remove old listeners to avoid multiple fires
          PushNotifications.removeAllListeners();

          PushNotifications.addListener('registration', async (token) => {
            const fcmToken = token.value;

            // Store token in Supabase
            const { error } = await supabase
              .from("push_subscriptions")
              .upsert(
                {
                  user_id: user.id,
                  endpoint: fcmToken,
                  p256dh: "native-fcm",
                  auth: "native-fcm",
                },
                {
                  onConflict: "user_id,endpoint",
                }
              );

            if (error) {
              console.error("❌ Failed to store native push token:", error);
              resolve(false);
            } else {
              localStorage.setItem("push_subscribed", "true");
              localStorage.setItem("native_fcm_token", fcmToken);
              setState((prev) => ({ ...prev, isSubscribed: true }));
              resolve(true);
            }
          });

          PushNotifications.addListener('registrationError', (error) => {
            console.error('❌ native registrationError: ', error);
            resolve(false);
          });

          // Trigger native register prompt
          PushNotifications.register();
        });
      } catch (err) {
        console.error("❌ Capacitor push subscription failed:", err);
        return false;
      }
    }

    // Web Push implementation
    try {
      if (Notification.permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      if (!VAPID_PUBLIC_KEY) {
        throw new Error("Missing VAPID public key");
      }

      const registration = await navigator.serviceWorker.ready;

      // Always unsubscribe first
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      });

      const json = subscription.toJSON();

      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Invalid push subscription");
      }

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
      console.error("❌ Web Push subscribe failed:", err);
      return false;
    }
  }, [state.isSupported, user, requestPermission]);

  // -----------------------------
  // UNSUBSCRIBE
  // -----------------------------
  const unsubscribe = useCallback(async () => {
    if (!state.isSupported || !user) return false;

    if (isCapacitor) {
      try {
        const token = localStorage.getItem("native_fcm_token");
        if (token) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", user.id)
            .eq("endpoint", token);
        }

        localStorage.removeItem("push_subscribed");
        localStorage.removeItem("native_fcm_token");
        setState((prev) => ({ ...prev, isSubscribed: false }));
        return true;
      } catch (err) {
        console.error("❌ Capacitor push unsubscribe failed:", err);
        return false;
      }
    }

    // Web push implementation
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
      console.error("❌ Web Push unsubscribe failed:", err);
      return false;
    }
  }, [state.isSupported, user]);

  // -----------------------------
  // LOCAL TEST NOTIFICATION
  // -----------------------------
  const sendLocalNotification = useCallback(
    async (title: string, body?: string) => {
      if (isCapacitor) {
        // Local notification test bypassed on Capacitor
        return false;
      }

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

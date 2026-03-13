import { useState, useEffect, useCallback } from "react";

export interface NotificationPreferences {
  reservationSound: boolean;
  transactionSound: boolean;
  browserNotifications: boolean;
  emailAlerts: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  reservationSound: true,
  transactionSound: true,
  browserNotifications: false,
  emailAlerts: true,
};

const STORAGE_KEY = "restaurant_notification_preferences";

export const useNotificationPreferences = (restaurantId?: string) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (!restaurantId) return;
    
    const stored = localStorage.getItem(`${STORAGE_KEY}_${restaurantId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      } catch (e) {
        console.error("Failed to parse notification preferences:", e);
      }
    }
  }, [restaurantId]);

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    if (!restaurantId) return;
    
    setPreferences(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(`${STORAGE_KEY}_${restaurantId}`, JSON.stringify(updated));
      return updated;
    });
  }, [restaurantId]);

  // Check if a specific sound should play
  const shouldPlaySound = useCallback((type: "reservation" | "transaction") => {
    if (type === "reservation") return preferences.reservationSound;
    if (type === "transaction") return preferences.transactionSound;
    return false;
  }, [preferences]);

  return {
    preferences,
    updatePreferences,
    shouldPlaySound,
  };
};

export default useNotificationPreferences;

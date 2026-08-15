import { useEffect } from "react";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Camera } from "@capacitor/camera";
import { PushNotifications } from "@capacitor/push-notifications";
import { Geolocation } from "@capacitor/geolocation";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import RestaurantDetail from "./pages/RestaurantDetail";
import EventDetail from "./pages/EventDetail";
import Pay from "./pages/Pay";
import Rewards from "./pages/Rewards";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword"; // ✅ ADD THIS
import RestaurantDashboard from "./pages/RestaurantDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import TransactionHistory from "./pages/TransactionHistory";
import MyReservations from "./pages/MyReservations";
import DineIn from "./pages/DineIn" ;
import ScanQR from "./pages/ScanQR" ;
import Support from "./pages/Support";
import FavoriteRestaurants from "./pages/FavoriteRestaurants";
import PaymentMethods from "./pages/PaymentMethods";
import PrivacySecurity from "./pages/PrivacySecurity";
import FAQs from "./pages/FAQs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import RestaurantPrivacyPolicy from "./pages/RestaurantPrivacyPolicy"; 
import RestaurantTermsCondition from "./pages/RestaurantTermsCondition";
import EventOrganiserOnboarding from "./pages/EventOrganiserOnboarding";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleRoute from "@/components/RoleRoute";
import DeleteAccount from "./pages/DeleteAccount";
import RefundPolicy from "./pages/RefundPolicy";
const queryClient = new QueryClient();
const ThemeSettings = registerPlugin<any>('ThemeSettings');
import NetworkBanner from "./components/NetworkBanner";
import AuthCallback from "./pages/AuthCallback";

const isMobileCustomer = import.meta.env.VITE_APP_TARGET === "mobile-customer";

const DeepLinkHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    CapApp.addListener("appUrlOpen", (event: any) => {
      const url = event.url;
      if (url.includes("auth/callback")) {
        Browser.close().catch((err) => console.warn("Error closing native browser:", err));
        const hash = url.split("#")[1] || "";
        const query = url.split("?")[1] || "";
        let targetPath = "/auth/callback";
        if (hash) {
          targetPath += `#${hash}`;
        } else if (query) {
          targetPath += `?${query}`;
        }
        navigate(targetPath);
      }
    });

    return () => {
      CapApp.removeAllListeners();
    };
  }, [navigate]);

  return null;
};

const NativePermissionsHandler = () => {
  useEffect(() => {
    const requestNativePermissions = async () => {
      const isCapacitor = (window as any).Capacitor !== undefined;
      if (!isCapacitor) return;

      try {
        await Geolocation.requestPermissions();
        await Camera.requestPermissions();
        await PushNotifications.requestPermissions();
      } catch (error) {
        console.warn("Native permissions request error:", error);
      }
    };

    requestNativePermissions();
  }, []);

  return null;
};

const App = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
    // Sync theme to native platform
    if (Capacitor.isNativePlatform()) {
      try {
        ThemeSettings.setTheme({ theme: savedTheme });
      } catch (e) {
        console.error("Error syncing theme to native side:", e);
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <DeepLinkHandler />
              <NativePermissionsHandler />
              <NetworkBanner />
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/restaurant/:id" element={<RestaurantDetail />} />
              <Route path="/pay" element={<ProtectedRoute><Pay /></ProtectedRoute>} />
              <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
              <Route path="/dine-in" element={<ProtectedRoute><DineIn /></ProtectedRoute>} />
              <Route path="/scan" element={<ProtectedRoute><ScanQR /></ProtectedRoute>} />
              <Route path="/support" element={<Support />} />
              <Route
                path="/profile"
                element={
                
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route path="/transactions" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
              <Route path="/reservations" element={<ProtectedRoute><MyReservations /></ProtectedRoute>} />
              <Route path="/favorites" element={<ProtectedRoute><FavoriteRestaurants /></ProtectedRoute>} />
              <Route path="/payments" element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />
              <Route path="/security" element={<PrivacySecurity />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsConditions />} />
              <Route path="/RestaurantPrivacyPolicy" element={<RestaurantPrivacyPolicy />} />
              <Route path="/RestaurantTermsCondition" element={<RestaurantTermsCondition />} />
              <Route path="/help" element={<FAQs />} /> 
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/delete-account" element={<ProtectedRoute><DeleteAccount /></ProtectedRoute>} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              {/* ✅ PASSWORD RESET ROUTE */}
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/event/:id" element={<EventDetail />} />

              {!isMobileCustomer && (
                <>
                  <Route
                    path="/restaurant-dashboard"
                    element={
                      <RoleRoute allowed={["restaurant", "event_organiser", "activity_provider"]}>
                        <RestaurantDashboard />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/event-organiser-onboarding"
                    element={
                      <RoleRoute allowed={["event_organiser"]}>
                        <EventOrganiserOnboarding />
                      </RoleRoute>
                    }
                  />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route
                    path="/admin"
                    element={
                      <RoleRoute allowed={["admin", "super_admin"]}>
                        <AdminPanel />
                      </RoleRoute>
                    }
                  />
                </>
              )}

              {/* MED-3 FIX: 404 catch-all route */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LocationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

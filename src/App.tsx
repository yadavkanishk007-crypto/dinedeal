import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/restaurant/:id" element={<RestaurantDetail />} />
            <Route path="/pay" element={<Pay />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/dine-in" element={<DineIn />} />
            <Route path="/scan" element={<ScanQR />} />
            <Route path="/support" element={<Support />} />
            <Route
              path="/profile"
              element={
              
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route path="/transactions" element={<TransactionHistory />} />
            <Route path="/reservations" element={<MyReservations />} />
            <Route path="/favorites" element={<FavoriteRestaurants />} />
            <Route path="/payments" element={<PaymentMethods />} />
            <Route path="/security" element={<PrivacySecurity />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/RestaurantPrivacyPolicy" element={<RestaurantPrivacyPolicy />} />
            <Route path="/RestaurantTermsCondition" element={<RestaurantTermsCondition />} />
            <Route path="/help" element={<FAQs />} /> 
            <Route path="/auth" element={<Auth />} />
            <Route path="/delete-account" element={<DeleteAccount />} />

            {/* ✅ PASSWORD RESET ROUTE */}
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/restaurant-dashboard"
              element={
                <RoleRoute allowed={["restaurant", "event_organiser"]}>
                  <RestaurantDashboard />
                </RoleRoute>
              }
            />
            <Route path="/event/:id" element={<EventDetail />} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

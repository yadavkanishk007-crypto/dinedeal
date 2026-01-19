import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import RestaurantDetail from "./pages/RestaurantDetail";
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
import Dinein from "./pages/DineIn" ;
import ScanQr from "./pages/ScanQR" ;
import NotFound from "./pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleRoute from "@/components/RoleRoute";

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
            <Route path="/auth" element={<Auth />} />

            {/* ✅ PASSWORD RESET ROUTE */}
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route
              path="/restaurant-dashboard"
              element={
                <RoleRoute allowed={["restaurant"]}>
                  <RestaurantDashboard />
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

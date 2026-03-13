import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type Role = "customer" | "restaurant" | "admin" | "super_admin" | "event_organiser";

export default function RoleRoute({
  allowed,
  children,
}: {
  allowed: Role[];
  children: JSX.Element;
}) {
  const { user, role, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!role || !allowed.includes(role)) {
    if (role === "restaurant"|| role === "event_organiser") return <Navigate to="/restaurant-dashboard" replace />;
    if (role === "admin" || role === "super_admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

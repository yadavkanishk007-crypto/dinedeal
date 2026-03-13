import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const { user, loading } = useAuth();

  if (loading) return null; // or <Loader />

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

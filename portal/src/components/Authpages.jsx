// ProtectedRoute.jsx - Only for admin access
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const ProtectedRoute = ({ allowedRoles = ["admin", "staff"], children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    if (user?.role === "admin") {
      return <Navigate to="/dashboard" replace />;
    }
    if (user?.role === "staff") {
      return <Navigate to="/dashboard" replace />;
    }
  }
  return children;
};

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

type Role = "author" | "reviewer" | "editor" | "admin";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { role, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Checking access...
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (role) return <Outlet />;
};

export default ProtectedRoute;

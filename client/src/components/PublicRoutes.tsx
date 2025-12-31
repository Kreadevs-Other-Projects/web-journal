import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { roleConfig } from "@/lib/roles";

type UserRole = "author" | "reviewer" | "editor" | "publisher";

const PublicRoute = () => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }
  if (isAuthenticated && role) {
    return <Navigate to={roleConfig[role.role].route} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;

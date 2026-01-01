import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { roleConfig } from "../lib/roles";
import { LoadingSpinner } from "./ui/LoadingSpinner";

const PUBLIC_ENTRY_PATHS = ["/", "/login", "/signup", "/initialCheckout"];

const InitialAuthCheck = ({ children }: { children: React.ReactNode }) => {
  const { role, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && role) {
      const config = roleConfig[role.role as keyof typeof roleConfig];
      if (config) {
        navigate(config.route, { replace: true });
      }
    }
  }, [isLoading, role, navigate, location]);

  if (isLoading) {
    return <LoadingSpinner text="Checking authentication..." />;
  }

  return <>{children}</>;
};

export default InitialAuthCheck;

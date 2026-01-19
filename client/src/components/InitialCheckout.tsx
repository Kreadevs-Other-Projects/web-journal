import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { roleConfig } from "../lib/roles";
import { LoadingSpinner } from "./ui/LoadingSpinner";

const PUBLIC_ENTRY_PATHS = ["/", "/login", "/signup", "/initialCheckout"];

const InitialAuthCheck = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user?.role) return;
    if (hasRedirected.current) return;

    const isPublicEntry = PUBLIC_ENTRY_PATHS.includes(location.pathname);

    if (isPublicEntry) {
      const config = roleConfig[user.role];

      if (config?.route) {
        hasRedirected.current = true;
        navigate(config.route, { replace: true });
      }
    }
  }, [isLoading, user?.role, location.pathname, navigate]);

  if (isLoading) {
    return <LoadingSpinner text="Checking authentication..." />;
  }

  return <>{children}</>;
};

export default InitialAuthCheck;

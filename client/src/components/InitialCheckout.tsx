import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { roleConfig } from "../lib/roles";
import { LoadingSpinner } from "./ui/LoadingSpinner";

const InitialAuthCheck = ({ children }: { children: React.ReactNode }) => {
  const { role, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!role) {
      return;
    }

    if (hasRedirected.current) {
      return;
    }

    if (location.pathname === "/" || location.pathname === "/login") {
      const config = roleConfig[role.role];

      if (config?.route) {
        hasRedirected.current = true;
        navigate(config.route, { replace: true });
      }
    }
  }, [isLoading, role, location.pathname, navigate]);

  if (isLoading) {
    return <LoadingSpinner text="Initializing JournalHub..." />;
  }

  return <>{children}</>;
};

export default InitialAuthCheck;

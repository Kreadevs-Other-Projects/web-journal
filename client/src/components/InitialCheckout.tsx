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
    // Only auto-redirect authenticated users when they land on a public entry path.
    // This prevents the component from overriding deliberate navigation to nested pages
    // such as `/author/submissions`.
    if (!isLoading && role) {
      const config = roleConfig[role.role];
      if (config) {
        const pathname = location.pathname;
        if (PUBLIC_ENTRY_PATHS.includes(pathname)) {
          navigate(config.route, { replace: true });
        }
      }
    }
  }, [isLoading, role, navigate, location]);

  if (isLoading) {
    return <LoadingSpinner text="Initializing JournalHub..." />;
  }

  return <>{children}</>;
};

export default InitialAuthCheck;

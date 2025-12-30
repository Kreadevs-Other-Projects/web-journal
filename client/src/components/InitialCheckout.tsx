import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { roleConfig } from "../lib/roles";
import { LoadingSpinner } from "./ui/LoadingSpinner";

const InitialAuthCheck = ({ children }: { children: React.ReactNode }) => {
  const { role, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (role) {
        const config = roleConfig[role.role];
        if (config) {
          navigate(config.route, { replace: true });
        }
      }
    }
  }, [isLoading, role, navigate]);

  if (isLoading) {
    return <LoadingSpinner text="Initializing JournalHub..." />;
  }

  return <>{children}</>;
};

export default InitialAuthCheck;

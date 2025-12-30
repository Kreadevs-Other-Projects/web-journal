import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

export type UserRole = "author" | "reviewer" | "editor" | "admin";

interface User {
  id: string;
  role: UserRole;
}

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  username?: string;
  exp: number;
}

interface AuthContextType {
  role: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [role, setRole] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await new Promise((res) => setTimeout(res, 2000));

      const storedToken = localStorage.getItem("accessToken");

      if (storedToken) {
        try {
          const decoded = jwtDecode<{
            id: string;
            role: UserRole;
            exp: number;
          }>(storedToken);

          if (decoded.exp * 1000 > Date.now()) {
            setRole({ id: decoded.id, role: decoded.role });
            setToken(storedToken);
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken: string) => {
    const decoded = jwtDecode<JwtPayload>(newToken);

    const userData: User = {
      id: decoded.id,
      role: decoded.role,
    };

    localStorage.setItem("accessToken", newToken);
    localStorage.setItem("user", JSON.stringify(userData));

    setToken(newToken);
    setRole(userData);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!token && !!role,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

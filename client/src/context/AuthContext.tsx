import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";

export type UserRole = "author" | "reviewer" | "chiefEditor" | "admin";

interface JwtPayload {
  user_id: number;
  role: UserRole;
  exp?: number;
}

interface AuthContextType {
  authToken: string | null;
  userId: number | null;
  role: UserRole | null;
  isAuthenticated: boolean;

  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  const isAuthenticated = !!authToken;

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");

    if (!storedToken) return;

    try {
      const decoded = jwtDecode<JwtPayload>(storedToken);

      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        logout();
        return;
      }

      setAuthToken(storedToken);
      setUserId(decoded.user_id);
      setRole(decoded.role);
    } catch (error) {
      console.error("Invalid token:", error);
      logout();
    }
  }, []);

  const login = (token: string) => {
    try {
      localStorage.setItem("authToken", token);

      const decoded = jwtDecode<JwtPayload>(token);

      setAuthToken(token);
      setUserId(decoded.user_id);
      setRole(decoded.role);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setAuthToken(null);
    setUserId(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        authToken,
        userId,
        role,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};

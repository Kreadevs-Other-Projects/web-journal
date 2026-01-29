import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import type { UserRole } from "@/lib/roles";
import { url } from "@/url";

export interface AuthUser {
  id: string;
  role: UserRole;
  email?: string;
  username?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  profile_pic: string;
  created_at?: string;
  title?: string;
  lastActive?: string;
  papersSubmitted?: number;
  papersReviewed?: number;
  citationCount?: number;
  hIndex?: number;
  expertise?: string[];
  qualifications?: string;
  certifications?: string;
}

interface JwtPayload {
  id: string;
  role: UserRole;
  email?: string;
  username?: string;
  exp: number;
}

interface AuthContextType {
  user: AuthUser | null;
  userData: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem("accessToken");

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode<JwtPayload>(storedToken);

        if (decoded.exp * 1000 < Date.now()) {
          logout();
          setIsLoading(false);
          return;
        }

        setUser({
          id: decoded.id,
          role: decoded.role,
          email: decoded.email,
          username: decoded.username,
        });

        setToken(storedToken);
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (newToken: string) => {
    const decoded = jwtDecode<JwtPayload>(newToken);

    const authUser: AuthUser = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      username: decoded.username,
    };

    localStorage.setItem("accessToken", newToken);

    setUser(authUser);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${url}/profile/getProfile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          const { user: apiUser, profile: apiProfile } = data.data;
          setUserData({
            id: apiUser.id,
            username: apiUser.username,
            email: apiUser.email,
            role: apiUser.role,
            profile_pic: apiUser.profile_pic,
            created_at: apiUser.created_at,
            title: apiUser.title || "",
            lastActive: apiProfile.lastActive || "",
            papersSubmitted: apiProfile.papersSubmitted || 0,
            papersReviewed: apiProfile.papersReviewed || 0,
            citationCount: apiProfile.citationCount || 0,
            hIndex: apiProfile.hIndex || 0,
            expertise: Array.isArray(apiProfile.expertise)
              ? apiProfile.expertise
              : [],
            qualifications: apiProfile.qualifications || "",
            certifications: apiProfile.certifications || "",
          });
        } else {
          console.error("Failed to fetch profile:", data.message);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

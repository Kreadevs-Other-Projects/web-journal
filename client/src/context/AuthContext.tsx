import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import type { UserRole } from "@/lib/roles";
import { url } from "@/url";

export interface RoleEntry {
  role: UserRole;
  journal_id: string | null;
  journal_name: string | null;
}

export interface AuthUser {
  id: string;
  role: UserRole;
  email?: string;
  username?: string;
  roles: RoleEntry[];
  active_journal_id: string | null;
  active_journal_name: string | null;
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
  // New format: RoleEntry[]; Old format: string[] — handled in decodeAuthUser
  roles?: any[];
  active_role?: UserRole;
  active_journal_id?: string | null;
  active_journal_name?: string | null;
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
  switchRole: (role: UserRole, journalId?: string | null) => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isActiveRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeAuthUser(token: string): AuthUser {
  const decoded = jwtDecode<JwtPayload>(token);

  // Handle both old JWT format (roles: string[]) and new (roles: RoleEntry[])
  let roles: RoleEntry[];
  if (!decoded.roles || decoded.roles.length === 0) {
    roles = [{ role: decoded.active_role ?? decoded.role, journal_id: null, journal_name: null }];
  } else if (typeof decoded.roles[0] === "string") {
    // Old format: string[] — upgrade to RoleEntry[]
    roles = (decoded.roles as string[]).map((r) => ({
      role: r as UserRole,
      journal_id: null,
      journal_name: null,
    }));
  } else {
    // New format: RoleEntry[]
    roles = decoded.roles as RoleEntry[];
  }

  return {
    id: decoded.id,
    role: decoded.active_role ?? decoded.role,
    email: decoded.email,
    username: decoded.username,
    roles,
    active_journal_id: decoded.active_journal_id ?? null,
    active_journal_name: decoded.active_journal_name ?? null,
  };
}

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

        setUser(decodeAuthUser(storedToken));
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
    localStorage.setItem("accessToken", newToken);
    setUser(decodeAuthUser(newToken));
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
    setToken(null);
  };

  const switchRole = async (role: UserRole, journalId?: string | null) => {
    const storedToken = localStorage.getItem("accessToken");
    if (!storedToken) throw new Error("Not authenticated");

    const res = await fetch(`${url}/auth/switch-role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify({ role, journal_id: journalId ?? null }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to switch role");

    login(data.token);
  };

  const hasRole = (role: UserRole) =>
    user?.roles.some((r) => r.role === role) ?? false;

  const isActiveRole = (role: UserRole) => user?.role === role;

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
        switchRole,
        hasRole,
        isActiveRole,
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

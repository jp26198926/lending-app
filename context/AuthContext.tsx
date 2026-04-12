"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  rate?: number;
  cashReceivable?: number;
  capitalContribution?: number;
  profitEarned?: number;
}

interface PageInfo {
  _id: string;
  page: string;
  path: string;
  parentId: string | null;
  order: number;
  status: string;
}

interface PermissionInfo {
  _id: string;
  permission: string;
  status: string;
}

interface PagePermissions {
  page: PageInfo;
  permissions: PermissionInfo[];
}

interface AuthContextType {
  user: User | null;
  permissions: PagePermissions[];
  loading: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (pagePath: string, permissionName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<PagePermissions[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshAuth = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
          setPermissions(data.permissions || []);
        } else {
          setUser(null);
          setPermissions([]);
        }
      } else {
        setUser(null);
        setPermissions([]);
      }
    } catch (error) {
      console.error("Session check failed:", error);
      setUser(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        setPermissions([]);
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const hasPermission = (pagePath: string, permissionName: string): boolean => {
    // Find the page in permissions
    const pagePermission = permissions.find((p) => p.page.path === pagePath);

    if (!pagePermission) {
      return false;
    }

    // Check if the permission exists for this page
    return pagePermission.permissions.some(
      (perm) => perm.permission.toLowerCase() === permissionName.toLowerCase(),
    );
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, permissions, loading, refreshAuth, logout, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

"use client";

import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function usePageAccess() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, permissions, loading } = useAuth();

  // Calculate access denied state
  const accessDenied = useMemo(() => {
    // Wait for auth to load
    if (loading) return false;

    // Public pages that don't require authentication
    const publicPages = ["/login", "/about"];
    const isPublicPage = publicPages.some((page) => pathname.startsWith(page));

    // If it's a public page, allow access
    if (isPublicPage) return false;

    // If user is not logged in, will redirect so not denied yet
    if (!user) return false;

    // For /home, allow access if logged in (no specific permission needed)
    if (pathname === "/home") return false;

    // For admin pages, check if user has "Access" permission
    if (pathname.startsWith("/admin")) {
      const hasAccess = permissions.some(
        (p) =>
          pathname.startsWith(p.page.path) &&
          p.permissions.some(
            (perm) =>
              perm.permission.toLowerCase() === "access" &&
              perm.status === "ACTIVE"
          )
      );
      return !hasAccess;
    }

    return false;
  }, [user, permissions, loading, pathname]);

  // Handle redirects in effect
  useEffect(() => {
    if (loading) return;

    const publicPages = ["/login", "/about"];
    const isPublicPage = publicPages.some((page) => pathname.startsWith(page));

    // If user is not logged in and trying to access protected page, redirect to login
    if (!user && !isPublicPage) {
      router.push("/login");
      return;
    }

    // Log warning for access denied
    if (accessDenied) {
      console.warn(`Access denied to ${pathname}`);
    }
  }, [user, loading, pathname, router, accessDenied]);

  return { loading, accessDenied };
}

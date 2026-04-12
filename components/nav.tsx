"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Nav() {
  const router = useRouter();
  const { user, permissions, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Build navigation links from database permissions
  const getNavigationLinks = () => {
    // Start with static/public links
    const staticLinks = [
      {
        label: "Home",
        path: "/home",
        requiresAuth: true,
        order: 0,
      },
      {
        label: "About",
        path: "/about",
        requiresAuth: false,
        order: 999,
      },
    ];

    if (!user) {
      // If not logged in, show only public links
      return staticLinks.filter((link) => !link.requiresAuth);
    }

    // Build links from permissions (pages user has access to)
    const permissionBasedLinks = permissions.map((perm) => ({
      label: perm.page.page, // Use the page name from database
      path: perm.page.path,
      requiresAuth: true,
      order: perm.page.order,
    }));

    // Combine static and permission-based links
    const allLinks = [...staticLinks, ...permissionBasedLinks];

    // Remove duplicates based on path and sort by order
    const uniqueLinks = allLinks.reduce(
      (acc, link) => {
        if (!acc.find((l) => l.path === link.path)) {
          acc.push(link);
        }
        return acc;
      },
      [] as typeof allLinks,
    );

    // Sort by order field
    return uniqueLinks.sort((a, b) => a.order - b.order);
  };

  const visibleNavLinks = getNavigationLinks();

  return (
    <nav
      style={{
        padding: "1rem",
        borderBottom: "1px solid #ccc",
        backgroundColor: "#f8f9fa",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "1rem" }}>
          {visibleNavLinks.map((link) => (
            <Link key={link.path} href={link.path}>
              {link.label}
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {loading ? (
            <span style={{ color: "#666", fontSize: "0.9rem" }}>
              Loading...
            </span>
          ) : user ? (
            <>
              <span style={{ color: "#666", fontSize: "0.9rem" }}>
                Welcome, {user.firstName} {user.lastName}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#4CAF50",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
                fontSize: "0.9rem",
              }}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

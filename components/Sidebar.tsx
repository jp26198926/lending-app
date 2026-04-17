"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  HomeIcon,
  UsersIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  KeyIcon,
  UserGroupIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

const iconMap: Record<string, any> = {
  "/home": HomeIcon,
  "/admin/user": UsersIcon,
  "/admin/role": UserGroupIcon,
  "/admin/page": DocumentTextIcon,
  "/admin/permission": KeyIcon,
  "/admin/rolepermission": ShieldCheckIcon,
  "/admin/dashboard": HomeIcon,
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, permissions, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Build navigation links from database permissions
  const getNavigationLinks = () => {
    if (!user) return [];

    // Build links from permissions (pages user has access to)
    const permissionBasedLinks = permissions
      .filter((perm) => perm.page.status === "ACTIVE")
      .map((perm) => ({
        label: perm.page.page,
        path: perm.page.path,
        icon: iconMap[perm.page.path] || DocumentTextIcon,
        order: perm.page.order,
      }));

    // Sort by order field
    return permissionBasedLinks.sort((a, b) => a.order - b.order);
  };

  const navLinks = getNavigationLinks();

  if (!user) return null;

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-zentyal-dark text-white rounded-lg lg:hidden hover:bg-zentyal-primary transition-colors"
      >
        {isMobileOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen
          flex flex-col
          transition-all duration-300 ease-in-out
          bg-zentyal-dark text-white
          ${isCollapsed ? "w-20" : "w-64"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zentyal-primary/30">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-zentyal-accent mt-10 md:mt-0">
              Lending App
            </h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-2 hover:bg-zentyal-primary/20 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <Bars3Icon className="h-5 w-5" />
            ) : (
              <XMarkIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-zentyal-primary/30">
          <div className="flex items-center space-x-3">
            <div className="shrink-0">
              <div className="w-10 h-10 bg-zentyal-accent rounded-full flex items-center justify-center text-zentyal-dark font-bold">
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.path || pathname.startsWith(link.path + "/");

            return (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center space-x-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-zentyal-primary text-white shadow-lg"
                      : "text-gray-300 hover:bg-zentyal-primary/20 hover:text-white"
                  }
                  ${isCollapsed ? "justify-center" : ""}
                `}
                title={isCollapsed ? link.label : ""}
              >
                <Icon
                  className={`${isCollapsed ? "h-6 w-6" : "h-5 w-5"} shrink-0`}
                />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{link.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-zentyal-primary/30">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
              text-gray-300 hover:bg-red-600/20 hover:text-red-400
              transition-colors
              ${isCollapsed ? "justify-center" : ""}
            `}
            title={isCollapsed ? "Logout" : ""}
          >
            <ArrowRightOnRectangleIcon
              className={`${isCollapsed ? "h-6 w-6" : "h-5 w-5"} shrink-0`}
            />
            {!isCollapsed && (
              <span className="text-sm font-medium">Logout</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

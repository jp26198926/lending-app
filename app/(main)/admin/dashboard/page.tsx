"use client";

import { useAuth } from "@/context/AuthContext";
import { usePageAccess } from "@/hooks/usePageAccess";
import PageNotFound from "@/components/PageNotFound";

export default function Dashboard() {
  const { loading, accessDenied } = usePageAccess();
  const { hasPermission } = useAuth();

  // Check permissions for this page
  const canAdd = hasPermission("/admin/dashboard", "Add");
  const canEdit = hasPermission("/admin/dashboard", "Edit");
  const canDelete = hasPermission("/admin/dashboard", "Delete");
  const canPrint = hasPermission("/admin/dashboard", "Print");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zentyal-primary"></div>
      </div>
    );
  }

  if (accessDenied) {
    return <PageNotFound />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">System overview and analytics</p>
      </div>

      {/* Action Buttons */}
      {(canAdd || canEdit || canDelete || canPrint) && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            {canAdd && (
              <button
                className="px-6 py-2.5 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark 
                         transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105
                         flex items-center space-x-2"
                onClick={() => console.log("Add clicked")}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Add New</span>
              </button>
            )}

            {canEdit && (
              <button
                className="px-6 py-2.5 bg-zentyal-accent text-white rounded-lg hover:bg-zentyal-primary 
                         transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105
                         flex items-center space-x-2"
                onClick={() => console.log("Edit clicked")}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>Edit</span>
              </button>
            )}

            {canDelete && (
              <button
                className="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 
                         transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105
                         flex items-center space-x-2"
                onClick={() => console.log("Delete clicked")}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>Delete</span>
              </button>
            )}

            {canPrint && (
              <button
                className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 
                         transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105
                         flex items-center space-x-2"
                onClick={() => console.log("Print clicked")}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                <span>Print</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-zentyal-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Users</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">0</h3>
              <p className="text-xs text-gray-500 mt-1">Active accounts</p>
            </div>
            <div className="w-12 h-12 bg-zentyal-primary/10 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-zentyal-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-zentyal-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Roles</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">0</h3>
              <p className="text-xs text-gray-500 mt-1">System roles</p>
            </div>
            <div className="w-12 h-12 bg-zentyal-accent/10 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-zentyal-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-zentyal-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Pages</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">0</h3>
              <p className="text-xs text-gray-500 mt-1">Registered pages</p>
            </div>
            <div className="w-12 h-12 bg-zentyal-success/10 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-zentyal-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Permissions</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">5</h3>
              <p className="text-xs text-gray-500 mt-1">Permission types</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            System Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Application</span>
              <span className="font-semibold text-gray-800">Lending App</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Version</span>
              <span className="font-semibold text-gray-800">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Framework</span>
              <span className="font-semibold text-gray-800">Next.js 16</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Database</span>
              <span className="font-semibold text-gray-800">MongoDB</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                Online
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Links</h2>
          <div className="space-y-2">
            <a
              href="/admin/user"
              className="flex items-center p-3 rounded-lg hover:bg-zentyal-light transition-colors"
            >
              <svg
                className="w-5 h-5 text-zentyal-primary mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span className="text-gray-700 hover:text-zentyal-primary font-medium">
                Manage Users
              </span>
            </a>
            <a
              href="/admin/role"
              className="flex items-center p-3 rounded-lg hover:bg-zentyal-light transition-colors"
            >
              <svg
                className="w-5 h-5 text-zentyal-primary mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 a3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="text-gray-700 hover:text-zentyal-primary font-medium">
                Manage Roles
              </span>
            </a>
            <a
              href="/admin/permission"
              className="flex items-center p-3 rounded-lg hover:bg-zentyal-light transition-colors"
            >
              <svg
                className="w-5 h-5 text-zentyal-primary mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="text-gray-700 hover:text-zentyal-primary font-medium">
                Manage Permissions
              </span>
            </a>
            <a
              href="/admin/page"
              className="flex items-center p-3 rounded-lg hover:bg-zentyal-light transition-colors"
            >
              <svg
                className="w-5 h-5 text-zentyal-primary mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-gray-700 hover:text-zentyal-primary font-medium">
                Manage Pages
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { usePageAccess } from "@/hooks/usePageAccess";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { loading } = usePageAccess();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zentyal-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome, {user?.firstName} {user?.lastName}!
        </h1>
        <p className="text-gray-600">Ready to manage your lending operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-zentyal-primary text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Your Rate</p>
              <h3 className="text-2xl font-bold mt-1">{user?.rate || 0}%</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-zentyal-accent text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">
                Cash Withdrawable
              </p>
              <h3 className="text-2xl font-bold mt-1">
                ₱{user?.cashWithdrawable?.toLocaleString() || 0}
              </h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-zentyal-success text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">
                Capital Contribution
              </p>
              <h3 className="text-2xl font-bold mt-1">
                ₱{user?.capitalContribution?.toLocaleString() || 0}
              </h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-purple-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Profit Earned</p>
              <h3 className="text-2xl font-bold mt-1">
                ₱{user?.profitEarned?.toLocaleString() || 0}
              </h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <p className="text-gray-600 mb-6">
          Use the sidebar to navigate to different sections of the application.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-zentyal-light rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-800 mb-2">📊 Dashboard</h3>
            <p className="text-sm text-gray-600">View analytics and reports</p>
          </div>
          <div className="p-4 bg-zentyal-light rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-800 mb-2">👥 Users</h3>
            <p className="text-sm text-gray-600">Manage user accounts</p>
          </div>
          <div className="p-4 bg-zentyal-light rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-800 mb-2">🔐 Permissions</h3>
            <p className="text-sm text-gray-600">Configure access control</p>
          </div>
        </div>
      </div>
    </div>
  );
}

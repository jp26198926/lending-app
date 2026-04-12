import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-zentyal-primary mb-4">
            Lending App
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8">
            Professional Financial Management System
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your lending operations with powerful tools for user
            management, role-based access control, and comprehensive financial
            tracking.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/login"
            className="px-8 py-4 bg-zentyal-primary text-white rounded-lg font-semibold text-lg 
                     hover:bg-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl
                     text-center"
          >
            Get Started →
          </Link>
          <Link
            href="/about"
            className="px-8 py-4 bg-white text-zentyal-primary rounded-lg font-semibold text-lg 
                     hover:bg-gray-50 transition-all duration-200 border-2 border-zentyal-primary
                     hover:border-orange-600 text-center"
          >
            Learn More
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-zentyal-primary hover:shadow-lg transition-all duration-200">
            <div className="w-12 h-12 bg-zentyal-accent rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              User Management
            </h3>
            <p className="text-gray-600">
              Comprehensive user profiles with financial tracking and role
              assignments.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-zentyal-primary hover:shadow-lg transition-all duration-200">
            <div className="w-12 h-12 bg-zentyal-accent rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Security & Permissions
            </h3>
            <p className="text-gray-600">
              Granular role-based access control with page-level permissions.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-zentyal-primary hover:shadow-lg transition-all duration-200">
            <div className="w-12 h-12 bg-zentyal-accent rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Financial Tracking
            </h3>
            <p className="text-gray-600">
              Track rates, receivables, capital contributions, and profit
              earnings.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            Built with Next.js, MongoDB, and modern security practices
          </p>
        </div>
      </div>
    </div>
  );
}

export default function About() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="bg-zentyal-primary text-white rounded-xl shadow-xl p-8 mb-6">
        <h1 className="text-4xl font-bold mb-4">About Lending App</h1>
        <p className="text-xl text-white/90">
          A comprehensive financial management system for modern lending
          operations
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Overview</h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          The Lending App is a professional-grade financial management system
          designed to streamline lending operations with powerful features for
          user management, role-based access control, and comprehensive
          financial tracking.
        </p>
        <p className="text-gray-700 mb-4 leading-relaxed">
          Built with modern technologies including Next.js, MongoDB, and JWT
          authentication, this application provides a secure and scalable
          solution for managing lending businesses.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-zentyal-primary rounded-lg flex items-center justify-center mr-4">
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Security First</h3>
          </div>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-zentyal-accent mr-2">✓</span>
              <span>JWT-based authentication with HTTP-only cookies</span>
            </li>
            <li className="flex items-start">
              <span className="text-zentyal-accent mr-2">✓</span>
              <span>Role-based access control (RBAC)</span>
            </li>
            <li className="flex items-start">
              <span className="text-zentyal-accent mr-2">✓</span>
              <span>Granular page-level permissions</span>
            </li>
            <li className="flex items-start">
              <span className="text-zentyal-accent mr-2">✓</span>
              <span>Password hashing with bcrypt</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-zentyal-accent rounded-lg flex items-center justify-center mr-4">
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
            <h3 className="text-xl font-bold text-gray-800">User Management</h3>
          </div>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-zentyal-accent mr-2">✓</span>
              <span>Full CRUD operations for users</span>
            </li>
            <li className="flex items-start">
              <span className="text-zentyal-accent mr-2">✓</span>
              <span>Financial profile tracking</span>
            </li>
            <li className="flex items-start">
              <span className="text-zentyal-accent mr-2">✓</span>
              <span>Role assignments</span>
            </li>
            <li className="flex items-start">
              <span className="text-zentyal-accent mr-2">✓</span>
              <span>Soft delete functionality</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-zentyal-success rounded-lg flex items-center justify-center mr-4">
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
            <h3 className="text-xl font-bold text-gray-800">
              Financial Tracking
            </h3>
          </div>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-zentyal-accent mr-2">✓</span>
              <span>Interest rates management</span>
            </li>
            <li className="flex items-start">
              <span className="text-zentyal-accent mr-2">✓</span>
              <span>Cash receivables tracking</span>
            </li>
            <li className="flex items-start">
              <span className="text-zentyal-accent mr-2">✓</span>
              <span>Capital contributions</span>
            </li>
            <li className="flex items-start">
              <span className="text-zentyal-accent mr-2">✓</span>
              <span>Profit calculations</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
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
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              Technology Stack
            </h3>
          </div>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-zentyal-accent mr-2">✓</span>
              <span>Next.js 16 with App Router</span>
            </li>
            <li className="flex items-start">
              <span className="text-zentyal-accent mr-2">✓</span>
              <span>MongoDB with Mongoose</span>
            </li>
            <li className="flex items-start">
              <span className="text-zentyal-accent mr-2">✓</span>
              <span>Tailwind CSS 4.0</span>
            </li>
            <li className="flex items-start">
              <span className="text-zentyal-accent mr-2">✓</span>
              <span>TypeScript for type safety</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-zentyal-dark text-white rounded-xl shadow-md p-6 text-center">
        <p className="text-lg mb-2">Built with modern web technologies</p>
        <p className="text-white/70 text-sm">
          Designed for security, scalability, and user experience
        </p>
      </div>
    </div>
  );
}

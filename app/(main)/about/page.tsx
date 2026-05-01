export default function About() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#ff6f00] to-[#ff8c00] text-white rounded-2xl shadow-2xl p-6 sm:p-10 mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
          About Lending App
        </h1>
        <p className="text-lg sm:text-xl text-white/95 leading-relaxed">
          A comprehensive financial management system designed to streamline
          lending operations with enterprise-grade security, advanced reporting,
          and intuitive user experience
        </p>
      </div>

      {/* Main Overview */}
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2d3748] mb-6">
          Overview
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            The Lending App is a professional-grade financial management system
            designed to streamline lending operations with powerful features for
            client management, loan processing, payment tracking, and
            comprehensive financial reporting.
          </p>
          <p>
            Built with cutting-edge technologies including Next.js 16, MongoDB,
            and JWT authentication, this application provides a secure,
            scalable, and mobile-responsive solution for managing lending
            businesses of any size.
          </p>
          <p>
            From individual lenders to large financial institutions, the Lending
            App offers the flexibility and features needed to manage your
            lending operations efficiently and securely.
          </p>
        </div>
      </div>

      {/* Core Lending Features */}
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2d3748] mb-6">
          Core Lending Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-l-4 border-[#ff6f00] pl-4">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Client Management
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Complete client profiles with contact information</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Track client lending history and credit status</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Status management (Active/Inactive/Deleted)</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Advanced search and filtering capabilities</span>
              </li>
            </ul>
          </div>

          <div className="border-l-4 border-[#a4c639] pl-4">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Loan Processing
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Flexible loan creation with custom terms</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Interest rate calculations and tracking</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Loan status tracking (Active/Paid/Defaulted)</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Due date management and alerts</span>
              </li>
            </ul>
          </div>

          <div className="border-l-4 border-[#ff6f00] pl-4">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Payment Tracking
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Record payments against loans</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Multiple payment methods support</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Payment history and audit trail</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Outstanding balance calculations</span>
              </li>
            </ul>
          </div>

          <div className="border-l-4 border-[#a4c639] pl-4">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Cycle Management
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Automated lending cycle processing</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Schedule-based operations (daily, weekly, monthly)</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Cycle status tracking and history</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Automated financial calculations</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Advanced Features */}
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2d3748] mb-6">
          Advanced Features
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* DataTable Features */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-[#ff6f00]/20">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-[#ff6f00] rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
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
                    d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                Professional DataTables
              </h3>
            </div>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Pagination with smart page navigation</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Global and column-specific search filters</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Sort by any column (ascending/descending)</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>CSV export with filtered data</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Professional print templates</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Mobile card view, desktop table view</span>
              </li>
            </ul>
          </div>

          {/* Security & Authentication */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-[#a4c639]/20">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-[#a4c639] rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
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
              <h3 className="text-xl font-bold text-gray-800">
                Enterprise Security
              </h3>
            </div>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>JWT authentication with HTTP-only cookies</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Role-based access control (RBAC)</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Granular page-level permissions</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Bcrypt password hashing</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Mobile app support with Bearer tokens</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>CORS support for cross-origin requests</span>
              </li>
            </ul>
          </div>

          {/* User Management */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-[#ff6f00]/20">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-[#ff6f00] rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                User & Role Management
              </h3>
            </div>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Complete user CRUD operations</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Dynamic role creation and assignment</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Financial profile tracking per user</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Soft delete with audit trail</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Password change functionality</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>User ledger and transaction history</span>
              </li>
            </ul>
          </div>

          {/* Financial Reporting */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-[#a4c639]/20">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-[#a4c639] rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
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
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                Financial Reporting
              </h3>
            </div>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Comprehensive ledger system</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>User-specific financial tracking</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Capital contributions and withdrawals</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Profit/loss calculations</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Cash receivable tracking</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] mr-2 font-bold">✓</span>
                <span>Export reports to CSV</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2d3748] mb-6">
          Technology Stack
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">▲</span>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-1">Next.js 16</h4>
              <p className="text-sm text-gray-600">
                Modern React framework with App Router and server components
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-1">MongoDB</h4>
              <p className="text-sm text-gray-600">
                NoSQL database with Mongoose ODM for data modeling
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-1">TypeScript</h4>
              <p className="text-sm text-gray-600">
                Type-safe code with enhanced developer experience
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">TW</span>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-1">Tailwind CSS 4.0</h4>
              <p className="text-sm text-gray-600">
                Utility-first CSS framework for rapid UI development
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">JWT</span>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-1">JWT Auth</h4>
              <p className="text-sm text-gray-600">
                Secure token-based authentication system
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">API</span>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-1">RESTful API</h4>
              <p className="text-sm text-gray-600">
                Well-structured API routes with CORS support
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Design Principles */}
      <div className="bg-gradient-to-br from-[#2d3748] to-[#1a202c] text-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6">
          Design Principles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-xl font-bold mb-3 text-[#ff6f00]">
              Mobile-First
            </h3>
            <p className="text-white/80 leading-relaxed">
              Fully responsive design that works seamlessly on all devices, from
              smartphones to desktop computers. Mobile card views automatically
              switch to table views on larger screens.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-3 text-[#a4c639]">
              User-Centric
            </h3>
            <p className="text-white/80 leading-relaxed">
              Intuitive interface with clear navigation, advanced search
              capabilities, and helpful feedback messages. Every feature is
              designed with the user experience in mind.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-3 text-[#ff6f00]">
              Secure by Default
            </h3>
            <p className="text-white/80 leading-relaxed">
              Security is built into every layer, from database transactions to
              frontend authorization. Multiple security layers protect your
              sensitive financial data.
            </p>
          </div>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#ff6f00]">
          <h3 className="text-xl font-bold text-gray-800 mb-4">For Lenders</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-[#a4c639] mr-3 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Automate repetitive tasks and focus on growing your business
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-[#a4c639] mr-3 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Track all loans, payments, and client information in one place
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-[#a4c639] mr-3 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Generate professional reports and export data for analysis
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-[#a4c639] mr-3 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Ensure data security with enterprise-grade authentication
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#a4c639]">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            For Administrators
          </h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-[#a4c639] mr-3 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Control who can access what with granular permissions</span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-[#a4c639] mr-3 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Create custom roles with specific permissions for each user
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-[#a4c639] mr-3 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Track all changes with comprehensive audit trails</span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-[#a4c639] mr-3 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Manage system settings and configurations from one dashboard
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Data Standards */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 sm:p-8 mb-8 border-2 border-blue-100">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2d3748] mb-4">
          Data Standards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
              <span className="w-8 h-8 bg-[#ff6f00] text-white rounded-lg flex items-center justify-center mr-3 text-sm">
                📅
              </span>
              Date Format - YYYY-MM-DD
            </h3>
            <p className="text-gray-700 mb-2">
              All dates consistently use ISO 8601 format (YYYY-MM-DD) throughout
              the application for clarity and international compatibility.
            </p>
            <div className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
              <code className="text-sm text-gray-800">Example: 2026-05-01</code>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
              <span className="w-8 h-8 bg-[#a4c639] text-white rounded-lg flex items-center justify-center mr-3 text-sm">
                💰
              </span>
              Amount Format - No Currency Symbol
            </h3>
            <p className="text-gray-700 mb-2">
              All monetary amounts are displayed without currency symbols, using
              monospace fonts for proper decimal alignment.
            </p>
            <div className="bg-white rounded-lg p-3 border-l-4 border-green-500">
              <code className="text-sm text-gray-800 font-mono">
                Example: 1,234.56
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-[#2d3748] to-[#1a202c] text-white rounded-2xl shadow-xl p-6 sm:p-8 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-[#ff6f00] rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-white"
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
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">Lending App</h3>
            <p className="text-lg text-white/90 mb-4">
              Professional Financial Management System
            </p>
          </div>
          <div className="border-t border-white/20 pt-6">
            <p className="text-white/80 mb-2">
              Built with modern web technologies for security, scalability, and
              exceptional user experience
            </p>
            <p className="text-white/60 text-sm">
              Powered by Next.js 16, MongoDB, TypeScript, and Tailwind CSS 4.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

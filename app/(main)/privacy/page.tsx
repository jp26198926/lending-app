export default function Privacy() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="bg-zentyal-primary text-white rounded-xl shadow-xl p-8 mb-6">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-xl text-white/90">
          Your privacy is important to us. Learn how we collect, use, and protect your information.
        </p>
        <p className="text-sm text-white/80 mt-4">
          Last Updated: May 1, 2026
        </p>
      </div>

      {/* Introduction */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Introduction</h2>
        <p className="text-gray-700 mb-4 leading-relaxed">
          This Privacy Policy describes how Lending App ("we", "us", or "our") collects, uses, 
          and protects your personal information when you use our lending management platform. 
          We are committed to protecting your privacy and ensuring the security of your personal data.
        </p>
        <p className="text-gray-700 leading-relaxed">
          By using our services, you agree to the collection and use of information in accordance 
          with this policy. If you do not agree with our policies and practices, please do not use our services.
        </p>
      </div>

      {/* Information We Collect */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Information We Collect</h2>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">Personal Information</h3>
        <p className="text-gray-700 mb-3 leading-relaxed">
          We collect information that you provide directly to us, including:
        </p>
        <ul className="space-y-2 text-gray-700 ml-6 mb-4">
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>Account information (name, email address, phone number)</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>Financial information (loan details, payment history, transaction records)</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>Authentication credentials (encrypted passwords)</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>Profile information (role, permissions, preferences)</span>
          </li>
        </ul>

        <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">Automatically Collected Information</h3>
        <p className="text-gray-700 mb-3 leading-relaxed">
          When you access our services, we automatically collect:
        </p>
        <ul className="space-y-2 text-gray-700 ml-6">
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>Device information (IP address, browser type, operating system)</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>Usage data (pages visited, time spent, actions taken)</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>Session information (login timestamps, access logs)</span>
          </li>
        </ul>
      </div>

      {/* How We Use Your Information */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">How We Use Your Information</h2>
        </div>
        
        <p className="text-gray-700 mb-3 leading-relaxed">
          We use the collected information for the following purposes:
        </p>
        <ul className="space-y-2 text-gray-700 ml-6">
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>To provide and maintain our lending management services</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>To process and track loans, payments, and financial transactions</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>To authenticate users and maintain account security</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>To communicate with you about your account and services</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>To generate reports and analytics for business operations</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>To detect and prevent fraud, abuse, and security incidents</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>To comply with legal obligations and regulatory requirements</span>
          </li>
        </ul>
      </div>

      {/* Data Security */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
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
          <h2 className="text-2xl font-bold text-gray-800">Data Security</h2>
        </div>
        
        <p className="text-gray-700 mb-3 leading-relaxed">
          We implement industry-standard security measures to protect your personal information:
        </p>
        <ul className="space-y-2 text-gray-700 ml-6">
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>Encryption:</strong> All sensitive data is encrypted in transit and at rest</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>Authentication:</strong> JWT-based authentication with secure HTTP-only cookies</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>Password Security:</strong> Passwords are hashed using bcrypt algorithm</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>Access Control:</strong> Role-based permissions system restricts data access</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>Audit Trails:</strong> All data modifications are logged with user and timestamp</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>Soft Delete:</strong> Data is never permanently removed, ensuring recoverability</span>
          </li>
        </ul>
      </div>

      {/* Data Sharing */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Data Sharing and Disclosure</h2>
        </div>
        
        <p className="text-gray-700 mb-3 leading-relaxed">
          We do not sell, trade, or rent your personal information to third parties. 
          We may share your information only in the following circumstances:
        </p>
        <ul className="space-y-2 text-gray-700 ml-6">
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>With Your Consent:</strong> When you explicitly authorize us to share information</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>Legal Requirements:</strong> When required by law, court order, or government request</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>Service Providers:</strong> With trusted third-party services (hosting, analytics) under strict confidentiality agreements</span>
          </li>
        </ul>
      </div>

      {/* User Rights */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
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
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Your Rights</h2>
        </div>
        
        <p className="text-gray-700 mb-3 leading-relaxed">
          You have the following rights regarding your personal information:
        </p>
        <ul className="space-y-2 text-gray-700 ml-6">
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>Access:</strong> Request a copy of your personal data we hold</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>Correction:</strong> Update or correct inaccurate information</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>Portability:</strong> Request your data in a structured, machine-readable format</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>Objection:</strong> Object to certain types of data processing</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>Withdraw Consent:</strong> Withdraw consent for data processing (where applicable)</span>
          </li>
        </ul>
        <p className="text-gray-700 mt-4 leading-relaxed">
          To exercise these rights, please contact us through the information provided below.
        </p>
      </div>

      {/* Cookies and Tracking */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
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
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Cookies and Tracking Technologies</h2>
        </div>
        
        <p className="text-gray-700 mb-3 leading-relaxed">
          We use cookies and similar tracking technologies to enhance your experience:
        </p>
        <ul className="space-y-2 text-gray-700 ml-6 mb-4">
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>Essential Cookies:</strong> Required for authentication and security (HTTP-only cookies for JWT tokens)</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>Functional Cookies:</strong> Remember your preferences and settings</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span><strong>Analytics Cookies:</strong> Help us understand how you use our services</span>
          </li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          Most web browsers allow you to control cookies through settings. However, disabling 
          essential cookies may prevent you from using certain features of our services.
        </p>
      </div>

      {/* Data Retention */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Data Retention</h2>
        </div>
        
        <p className="text-gray-700 mb-3 leading-relaxed">
          We retain your personal information for as long as necessary to:
        </p>
        <ul className="space-y-2 text-gray-700 ml-6 mb-4">
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>Provide our services and maintain your account</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>Comply with legal, regulatory, tax, and accounting obligations</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>Resolve disputes and enforce our agreements</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>Maintain audit trails and business records</span>
          </li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          When data is no longer needed, we employ soft deletion practices, marking records as 
          deleted while preserving data integrity and audit trails. This approach ensures compliance 
          with financial regulations and enables data recovery if needed.
        </p>
      </div>

      {/* Children's Privacy */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Children's Privacy</h2>
        <p className="text-gray-700 leading-relaxed">
          Our services are not intended for individuals under the age of 18. We do not knowingly 
          collect personal information from children. If you believe we have collected information 
          from a child, please contact us immediately, and we will take steps to delete such information.
        </p>
      </div>

      {/* Changes to Privacy Policy */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Changes to This Privacy Policy</h2>
        <p className="text-gray-700 mb-3 leading-relaxed">
          We may update this Privacy Policy from time to time to reflect changes in our practices, 
          technology, legal requirements, or other factors. When we make changes:
        </p>
        <ul className="space-y-2 text-gray-700 ml-6 mb-4">
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>We will update the "Last Updated" date at the top of this policy</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>We will notify you of significant changes through email or in-app notifications</span>
          </li>
          <li className="flex items-start">
            <span className="text-zentyal-accent mr-2">•</span>
            <span>Your continued use of our services after changes constitutes acceptance</span>
          </li>
        </ul>
        <p className="text-gray-700 leading-relaxed">
          We encourage you to review this Privacy Policy periodically to stay informed about 
          how we protect your information.
        </p>
      </div>

      {/* Contact Information */}
      <div className="bg-gradient-to-r from-zentyal-primary to-zentyal-accent text-white rounded-xl shadow-xl p-8">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Contact Us</h2>
        </div>
        
        <p className="text-white/90 mb-4 leading-relaxed">
          If you have any questions, concerns, or requests regarding this Privacy Policy or 
          our data practices, please contact us:
        </p>
        
        <div className="space-y-3 text-white/90">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <div>
              <strong className="text-white">Email:</strong> privacy@lendingapp.com
            </div>
          </div>
          
          <div className="flex items-start">
            <svg
              className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <div>
              <strong className="text-white">Phone:</strong> +1 (555) 123-4567
            </div>
          </div>
          
          <div className="flex items-start">
            <svg
              className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <div>
              <strong className="text-white">Address:</strong> 123 Business Street, Suite 100, City, State 12345
            </div>
          </div>
        </div>
        
        <p className="text-white/80 text-sm mt-6">
          We aim to respond to all privacy-related inquiries within 30 business days.
        </p>
      </div>
    </div>
  );
}

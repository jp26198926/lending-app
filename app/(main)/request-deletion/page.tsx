"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import LoadingModal from "@/components/LoadingModal";
import SuccessModal from "@/components/SuccessModal";
import ErrorModal from "@/components/ErrorModal";

export default function RequestDeletion() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    email: user?.email || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    reason: "",
    additionalInfo: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.reason) {
      setErrorMessage("Email and reason are required");
      setShowError(true);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/request-deletion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit deletion request");
      }

      setShowSuccess(true);
      // Reset form
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        reason: "",
        additionalInfo: "",
      });
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to submit deletion request",
      );
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl shadow-2xl p-6 sm:p-10 mb-8">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-4">
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Request Data Deletion
            </h1>
          </div>
        </div>
        <p className="text-lg sm:text-xl text-white/95 leading-relaxed">
          Submit a request to delete your account and associated personal data
          from our system
        </p>
      </div>

      {/* Information Section */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-8">
        <div className="flex items-start">
          <svg
            className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-lg font-bold text-blue-900 mb-2">
              Important Information
            </h3>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li>
                • Your deletion request will be reviewed by our team within 30
                days
              </li>
              <li>
                • We will send a confirmation email once your request is
                processed
              </li>
              <li>
                • Some data may be retained for legal or security purposes as
                required by law
              </li>
              <li>• Once deleted, your account and data cannot be recovered</li>
              <li>
                • Outstanding financial obligations must be settled before
                deletion
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Deletion Request Form
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={!!user}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6f00] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="your.email@example.com"
            />
            {user && (
              <p className="mt-1 text-sm text-gray-500">
                Email detected from your logged-in account
              </p>
            )}
          </div>

          {/* First Name */}
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              First Name (Optional)
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              disabled={!!user}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6f00] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="John"
            />
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Last Name (Optional)
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              disabled={!!user}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6f00] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Doe"
            />
          </div>

          {/* Reason */}
          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Reason for Deletion <span className="text-red-500">*</span>
            </label>
            <select
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6f00] focus:border-transparent"
            >
              <option value="">Select a reason...</option>
              <option value="no-longer-need">
                I no longer need the service
              </option>
              <option value="privacy-concerns">Privacy concerns</option>
              <option value="switching-service">
                Switching to another service
              </option>
              <option value="account-security">Account security issues</option>
              <option value="too-many-emails">Too many emails</option>
              <option value="not-satisfied">Not satisfied with service</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Additional Information */}
          <div>
            <label
              htmlFor="additionalInfo"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Additional Information (Optional)
            </label>
            <textarea
              id="additionalInfo"
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6f00] focus:border-transparent resize-none"
              placeholder="Please provide any additional details about your deletion request..."
            />
            <p className="mt-1 text-sm text-gray-500">
              This information helps us improve our service
            </p>
          </div>

          {/* Warning Box */}
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h4 className="text-sm font-bold text-red-900 mb-1">
                  Warning: This action is permanent
                </h4>
                <p className="text-sm text-red-800">
                  Once your deletion request is approved and processed, all your
                  data will be permanently removed and cannot be recovered. Make
                  sure you have downloaded any information you wish to keep.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Submitting..." : "Submit Deletion Request"}
            </button>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-50 rounded-xl p-6 text-center mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          Need Help or Have Questions?
        </h3>
        <p className="text-gray-600 mb-4">
          If you have any questions about the data deletion process, please
          contact our support team.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="flex items-center text-sm text-gray-700">
            <svg
              className="w-5 h-5 mr-2 text-[#ff6f00]"
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
            <span>support@lendingapp.com</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <svg
              className="w-5 h-5 mr-2 text-[#ff6f00]"
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
            <span>+1 (555) 123-4567</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <LoadingModal isOpen={loading} message="Submitting deletion request..." />

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        message="Deletion request submitted successfully! We will review your request and contact you via email within 30 days."
      />

      <ErrorModal
        isOpen={showError}
        onClose={() => setShowError(false)}
        message={errorMessage}
      />
    </div>
  );
}

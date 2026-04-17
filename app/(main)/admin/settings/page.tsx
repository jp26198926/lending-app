"use client";

import { useState, useEffect } from "react";
import { usePageAccess } from "@/hooks/usePageAccess";
import { useAuth } from "@/context/AuthContext";
import PageNotFound from "@/components/PageNotFound";
import LoadingModal from "@/components/LoadingModal";
import ErrorModal from "@/components/ErrorModal";
import toast from "react-hot-toast";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Settings {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  cashOnHand: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
  updatedBy?: User;
}

export default function SettingsPage() {
  const { loading: pageLoading, accessDenied } = usePageAccess();
  const { hasPermission, user: currentUser } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    cashOnHand: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: "",
  });

  const canEdit = hasPermission("/admin/settings", "Edit");

  // Helper function to format date to YYYY-MM-DD
  const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setFormData({
          name: data.name,
          phone: data.phone || "",
          email: data.email || "",
          cashOnHand: data.cashOnHand,
        });
      } else {
        const error = await res.json();
        setErrorModal({
          isOpen: true,
          message: error.error || "Failed to fetch settings.",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to fetch settings. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (pageLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zentyal-primary"></div>
      </div>
    );
  }

  if (accessDenied) {
    return <PageNotFound />;
  }

  if (!settings) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowLoadingModal(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          updatedBy: currentUser?._id,
        }),
      });

      if (res.ok) {
        toast.success("Settings updated successfully! ✅");
        setIsEditing(false);
        await fetchSettings();
      } else {
        const error = await res.json();
        setErrorModal({
          isOpen: true,
          message: error.error || "Update failed. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorModal({
        isOpen: true,
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
      setShowLoadingModal(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: settings.name,
      phone: settings.phone || "",
      email: settings.email || "",
      cashOnHand: settings.cashOnHand,
    });
  };

  const getUserFullName = (user: User) => {
    return `${user.firstName} ${user.lastName}`;
  };

  return (
    // <div className="max-w-4xl mx-auto mt-10 md:mt-0">
    <div className="max-w-7xl mx-auto mt-10 md:mt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-10 md:mt-0">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Application Settings
          </h1>
          <p className="text-gray-600">
            Manage your application configuration and details
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
        {!isEditing && canEdit && (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full sm:w-auto px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 
                     transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105
                     flex items-center justify-center gap-2"
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
            <span>Edit Settings</span>
          </button>
        )}

        {isEditing && (
          <button
            onClick={handleCancel}
            className="w-full sm:w-auto px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 
                     transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105
                     flex items-center justify-center gap-2"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Application Information Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-zentyal-primary">
              Application Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Name <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                    placeholder="Enter application name"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-semibold">
                    {settings.name}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                    placeholder="Enter contact phone (optional)"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                    {settings.phone || "N/A"}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                    placeholder="Enter contact email (optional)"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                    {settings.email || "N/A"}
                  </div>
                )}
              </div>

              {/* Cash on Hand */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cash on Hand <span className="text-red-500">*</span>
                </label>
                {/* {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cashOnHand}
                    disabled
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cashOnHand: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                  />
                ) : ( */}
                <div className="px-4 py-2.5 bg-gray-50 rounded-lg">
                  <span className="font-mono font-semibold text-lg text-green-600">
                    {settings.cashOnHand.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {/* )} */}
              </div>
            </div>
          </div>

          {/* Audit Information Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-zentyal-primary">
              Audit Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created At
                </label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                  {formatDate(settings.createdAt)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created By
                </label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                  {settings.createdBy
                    ? getUserFullName(settings.createdBy)
                    : "System"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Updated
                </label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                  {formatDate(settings.updatedAt)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Updated By
                </label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                  {settings.updatedBy
                    ? getUserFullName(settings.updatedBy)
                    : "System"}
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="flex justify-end pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark 
                         transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Loading Modal */}
      <LoadingModal
        isOpen={showLoadingModal}
        message="Processing your request..."
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: "" })}
        message={errorModal.message}
      />
    </div>
  );
}

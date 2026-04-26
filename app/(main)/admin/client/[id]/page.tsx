"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageAccess } from "@/hooks/usePageAccess";
import { useAuth } from "@/context/AuthContext";
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ArrowLeftIcon,
  PencilIcon,
  ClockIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { LoadingSpinner, StatusBadge } from "@/components/CRUDComponents";
import ConfirmModal from "@/components/ConfirmModal";
import LoadingModal from "@/components/LoadingModal";
import PageNotFound from "@/components/PageNotFound";
import ErrorModal from "@/components/ErrorModal";
import toast from "react-hot-toast";

interface Client {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  deletedAt?: string;
  deletedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  deletedReason?: string;
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === "new";

  const { loading: pageLoading, accessDenied } = usePageAccess();
  const { hasPermission, user: currentUser } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [isEditing, setIsEditing] = useState(isNew);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: "",
  });

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    status: "ACTIVE",
  });

  const canEdit = hasPermission("/admin/client", "Edit");
  const canDelete = hasPermission("/admin/client", "Delete");
  const canAdd = hasPermission("/admin/client", "Add");

  const fetchClient = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/client/${id}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data);
        setFormData({
          firstName: data.firstName,
          middleName: data.middleName || "",
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
          address: data.address,
          status: data.status,
        });
      } else {
        setErrorModal({
          isOpen: true,
          message: "Client not found. Redirecting to client list...",
        });
        setTimeout(() => router.push("/admin/client"), 2000);
      }
    } catch (error) {
      console.error("Error fetching client:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to fetch client details. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!isNew && id) {
      fetchClient();
    }
  }, [id, isNew, fetchClient]);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (accessDenied) {
    return <PageNotFound />;
  }

  if (isNew && !canAdd) {
    return <PageNotFound />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowLoadingModal(true);

    try {
      const url = isNew ? "/api/admin/client" : `/api/admin/client/${id}`;
      const method = isNew ? "POST" : "PUT";

      const payload = {
        ...formData,
        [isNew ? "createdBy" : "updatedBy"]: currentUser?._id,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(
          isNew
            ? "Client created successfully! 🎉"
            : "Client updated successfully! ✅",
        );
        if (isNew) {
          const newClient = await res.json();
          router.push(`/admin/client/${newClient._id}`);
        } else {
          setIsEditing(false);
          fetchClient();
        }
      } else {
        const error = await res.json();
        setErrorModal({
          isOpen: true,
          message: error.error || "Operation failed. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorModal({
        isOpen: true,
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setShowLoadingModal(false);
    }
  };

  const handleDeleteConfirm = async (reason?: string) => {
    if (!reason) return;
    
    setShowDeleteModal(false);
    setShowLoadingModal(true);

    try {
      const res = await fetch(
        `/api/admin/client/${id}?deletedBy=${currentUser?._id}&deletedReason=${encodeURIComponent(reason)}`,
        { method: "DELETE" },
      );

      if (res.ok) {
        toast.success("Client deleted successfully! 🗑️");
        router.push("/admin/client");
      } else {
        const error = await res.json();
        setErrorModal({
          isOpen: true,
          message: error.error || "Delete failed. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorModal({
        isOpen: true,
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setShowLoadingModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const fullName = [formData.firstName, formData.middleName, formData.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="p-1 max-w-7xl mx-auto mt-10 md:mt-0">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => router.push("/admin/client")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isNew ? "New Client" : "Client Profile"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isNew
                ? "Create a new client record"
                : "Detailed client information"}
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto justify-center">
          {!isNew && !isEditing && canEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-zentyal-accent text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <PencilIcon className="h-5 w-5" />
              <span>Edit Client</span>
            </button>
          )}
          {!isNew &&
            !isEditing &&
            canDelete &&
            client?.status !== "DELETED" && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <TrashIcon className="h-5 w-5" />
                <span>Delete</span>
              </button>
            )}
        </div>
      </div>

      {isEditing ? (
        /* Edit/Create Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserCircleIcon className="h-6 w-6 text-zentyal-primary" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                           focus:ring-zentyal-primary focus:border-transparent transition-all"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={formData.middleName}
                  onChange={(e) =>
                    setFormData({ ...formData, middleName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                           focus:ring-zentyal-primary focus:border-transparent transition-all"
                  placeholder="Michael"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                           focus:ring-zentyal-primary focus:border-transparent transition-all"
                  placeholder="Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                           focus:ring-zentyal-primary focus:border-transparent transition-all"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information Card */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <EnvelopeIcon className="h-6 w-6 text-zentyal-primary" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                           focus:ring-zentyal-primary focus:border-transparent transition-all"
                  placeholder="john.doe@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                           focus:ring-zentyal-primary focus:border-transparent transition-all"
                  placeholder="+1234567890"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                           focus:ring-zentyal-primary focus:border-transparent transition-all resize-none"
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark 
                       transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <CheckCircleIcon className="h-5 w-5" />
              <span>{isNew ? "Create Client" : "Save Changes"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (isNew) {
                  router.push("/admin/client");
                } else {
                  setIsEditing(false);
                  fetchClient();
                }
              }}
              className="w-full sm:w-auto px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 
                       transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <XCircleIcon className="h-5 w-5" />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      ) : (
        /* View Mode */
        <>
          {/* Profile Card */}
          <div className="bg-zentyal-primary rounded-xl shadow-xl p-8 mb-6 text-white">
            <div className="flex items-start justify-between flex-col md:flex-row gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{fullName}</h2>
                  <div className="flex items-center gap-2 text-orange-100 mb-3">
                    <EnvelopeIcon className="h-5 w-5" />
                    <span className="text-lg">{client?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-orange-100">
                    <PhoneIcon className="h-5 w-5" />
                    <span className="text-lg">{client?.phone}</span>
                  </div>
                </div>
              </div>
              <div className="text-left md:text-right">
                <StatusBadge status={client?.status || "ACTIVE"} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-xs text-orange-100">
                Client ID: {client?._id}
              </p>
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPinIcon className="h-6 w-6 text-zentyal-primary" />
              Address
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900">{client?.address}</p>
            </div>
          </div>

          {/* Timeline & Audit Information */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClockIcon className="h-6 w-6 text-zentyal-primary" />
              Timeline & Audit Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Created Info */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm font-semibold text-green-800 mb-2">
                  Created
                </p>
                <p className="text-sm text-gray-700 mb-1">
                  {client &&
                    new Date(client.createdAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                </p>
                {client?.createdBy && (
                  <p className="text-xs text-gray-600">
                    By: {client.createdBy.firstName} {client.createdBy.lastName}
                    <span className="text-gray-500">
                      {" "}
                      ({client.createdBy.email})
                    </span>
                  </p>
                )}
              </div>

              {/* Updated Info */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <p className="text-sm font-semibold text-orange-800 mb-2">
                  Last Updated
                </p>
                <p className="text-sm text-gray-700 mb-1">
                  {client &&
                    new Date(client.updatedAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                </p>
                {client?.updatedBy && (
                  <p className="text-xs text-gray-600">
                    By: {client.updatedBy.firstName} {client.updatedBy.lastName}
                    <span className="text-gray-500">
                      {" "}
                      ({client.updatedBy.email})
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Deletion Information (Conditional) */}
          {client?.deletedAt && (
            <div className="bg-red-50 rounded-xl shadow-md p-6 border-2 border-red-300">
              <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                <TrashIcon className="h-6 w-6 text-red-600" />
                Deletion Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-red-800 mb-2">
                    Deleted At
                  </p>
                  <p className="text-sm text-gray-700 mb-1">
                    {new Date(client.deletedAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  {client.deletedBy && (
                    <p className="text-xs text-gray-600">
                      By: {client.deletedBy.firstName}{" "}
                      {client.deletedBy.lastName}
                      <span className="text-gray-500">
                        {" "}
                        ({client.deletedBy.email})
                      </span>
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-800 mb-2">
                    Reason
                  </p>
                  <p className="text-sm text-gray-700">
                    {client.deletedReason || "No reason provided"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Client"
        message={`Are you sure you want to delete ${fullName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        requireReason={true}
        isLoading={false}
      />

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

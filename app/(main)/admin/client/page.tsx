"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageAccess } from "@/hooks/usePageAccess";
import { useAuth } from "@/context/AuthContext";
import PageNotFound from "@/components/PageNotFound";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import LoadingModal from "@/components/LoadingModal";
import ErrorModal from "@/components/ErrorModal";
import DataTable from "@/components/DataTable";
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
}

export default function ClientPage() {
  const router = useRouter();
  const { loading: pageLoading, accessDenied } = usePageAccess();
  const { hasPermission, user: currentUser } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    _id: "",
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [activateTarget, setActivateTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: "",
  });

  const canAdd = hasPermission("/admin/client", "Add");
  const canEdit = hasPermission("/admin/client", "Edit");
  const canDelete = hasPermission("/admin/client", "Delete");

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAdvancedSearch = async (filters: Record<string, string>) => {
    setLoading(true);
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const url = `/api/admin/client${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to fetch clients. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zentyal-primary"></div>
      </div>
    );
  }

  if (accessDenied) {
    return <PageNotFound />;
  }

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/client");
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to fetch clients. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowLoadingModal(true);

    try {
      const url = isEditing
        ? `/api/admin/client/${formData._id}`
        : "/api/admin/client";
      const method = isEditing ? "PUT" : "POST";

      const payload: {
        firstName: string;
        middleName: string;
        lastName: string;
        email: string;
        phone: string;
        address: string;
        createdBy?: string;
        updatedBy?: string;
      } = {
        ...formData,
        [isEditing ? "updatedBy" : "createdBy"]: currentUser?._id,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(
          isEditing
            ? "Client updated successfully! ✅"
            : "Client created successfully! 🎉",
        );
        resetForm();
        fetchClients();
        setShowFormModal(false);
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
      setLoading(false);
      setShowLoadingModal(false);
    }
  };

  const handleEdit = (client: Client) => {
    setFormData({
      _id: client._id,
      firstName: client.firstName,
      middleName: client.middleName || "",
      lastName: client.lastName,
      phone: client.phone,
      email: client.email,
      address: client.address,
    });
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (reason?: string) => {
    if (!deleteTarget || !reason) return;

    setShowDeleteModal(false);
    setShowLoadingModal(true);

    try {
      const res = await fetch(
        `/api/admin/client/${deleteTarget.id}?deletedBy=${currentUser?._id}&deletedReason=${encodeURIComponent(reason)}`,
        { method: "DELETE" },
      );

      if (res.ok) {
        toast.success("Client deleted successfully! 🗑️");
        fetchClients();
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
      setDeleteTarget(null);
    }
  };

  const handleActivateClick = (id: string, name: string) => {
    setActivateTarget({ id, name });
    setShowActivateModal(true);
  };

  const handleActivateConfirm = async () => {
    if (!activateTarget) return;

    setShowActivateModal(false);
    setShowLoadingModal(true);

    try {
      const res = await fetch(`/api/admin/client/${activateTarget.id}`, {
        method: "PATCH",
      });

      if (res.ok) {
        toast.success(
          `Client "${activateTarget.name}" activated successfully! ✅`,
        );
        fetchClients();
      } else {
        const error = await res.json();
        setErrorModal({
          isOpen: true,
          message: error.error || "Activation failed. Please try again.",
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
      setActivateTarget(null);
    }
  };

  const handleCloseFormModal = () => {
    resetForm();
    setShowFormModal(false);
  };

  const resetForm = () => {
    setFormData({
      _id: "",
      firstName: "",
      middleName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
    });
    setIsEditing(false);
  };

  const getFullName = (client: Client) => {
    const parts = [client.firstName, client.middleName, client.lastName].filter(
      Boolean,
    );
    return parts.join(" ");
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 mt-10 md:mt-0">
            Client
          </h1>
          <p className="text-gray-600">Manage client information and records</p>
        </div>
        {canAdd && (
          <button
            onClick={() => {
              resetForm();
              setShowFormModal(true);
            }}
            className="px-3 sm:px-6 py-3 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark 
                     transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105
                     flex items-center space-x-2"
            title="Add New Client"
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
            <span className="hidden sm:inline">Add New Client</span>
          </button>
        )}
      </div>

      {/* Clients Table with DataTable Component */}
      <DataTable
        data={clients}
        columns={[
          {
            key: "firstName",
            label: "First Name",
            sortable: true,
            searchable: true,
            render: (client: Client) => (
              <span className="text-sm font-medium text-gray-900">
                {client.firstName}
              </span>
            ),
            exportValue: (client: Client) => client.firstName,
          },
          {
            key: "lastName",
            label: "Last Name",
            sortable: true,
            searchable: true,
            render: (client: Client) => (
              <span className="text-sm font-medium text-gray-900">
                {client.lastName}
              </span>
            ),
            exportValue: (client: Client) => client.lastName,
          },
          {
            key: "email",
            label: "Email",
            sortable: true,
            searchable: true,
            render: (client: Client) => (
              <span className="text-sm text-gray-900">{client.email}</span>
            ),
            exportValue: (client: Client) => client.email,
          },
          {
            key: "phone",
            label: "Phone",
            sortable: true,
            searchable: true,
            render: (client: Client) => (
              <span className="text-sm text-gray-600">{client.phone}</span>
            ),
            exportValue: (client: Client) => client.phone,
          },
          {
            key: "address",
            label: "Address",
            sortable: true,
            searchable: true,
            render: (client: Client) => (
              <span className="text-sm text-gray-600 truncate max-w-xs block">
                {client.address}
              </span>
            ),
            exportValue: (client: Client) => client.address,
          },
          {
            key: "status",
            label: "Status",
            sortable: true,
            searchable: true,
            render: (client: Client) => (
              <div className="flex justify-end md:justify-center">
                <span
                  className={`inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full
                    ${
                      client.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : client.status === "INACTIVE"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-red-100 text-red-800"
                    }`}
                >
                  {client.status}
                </span>
              </div>
            ),
            exportValue: (client: Client) => client.status,
          },
          {
            key: "actions",
            label: "Actions",
            sortable: false,
            searchable: false,
            render: (client: Client) => (
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/admin/client/${client._id}`);
                  }}
                  className="p-1.5 sm:p-2 text-zentyal-primary hover:bg-zentyal-primary/10 rounded-lg transition-colors"
                  title="View Details"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(client);
                    }}
                    className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Edit Client"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
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
                  </button>
                )}
                {canDelete && client.status === "ACTIVE" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(client._id, getFullName(client));
                    }}
                    className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Client"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
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
                  </button>
                )}
                {canEdit &&
                  (client.status === "DELETED" ||
                    client.status === "INACTIVE") && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivateClick(client._id, getFullName(client));
                      }}
                      className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Activate Client"
                    >
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                  )}
              </div>
            ),
          },
        ]}
        loading={loading}
        emptyMessage="No clients found"
        emptyIcon={
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
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
        }
        exportFileName="clients"
        searchPlaceholder="Search clients..."
        itemsPerPage={10}
        onRowClick={(client) => router.push(`/admin/client/${client._id}`)}
        onAdvancedSearch={handleAdvancedSearch}
      />

      {/* Create/Edit Client Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={handleCloseFormModal}
        title={isEditing ? "Edit Client" : "Create New Client"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* First Name */}
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-zentyal-primary"
                required
              />
            </div>

            {/* Middle Name */}
            <div>
              <label
                htmlFor="middleName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Middle Name
              </label>
              <input
                type="text"
                id="middleName"
                value={formData.middleName}
                onChange={(e) =>
                  setFormData({ ...formData, middleName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-zentyal-primary"
              />
            </div>

            {/* Last Name */}
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-zentyal-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-zentyal-primary"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-zentyal-primary"
                required
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                       focus:ring-zentyal-primary focus:border-zentyal-primary"
              required
            />
          </div>

          {/* Status */}
          {/* <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as "ACTIVE" | "INACTIVE",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                       focus:ring-zentyal-primary focus:border-zentyal-primary"
              required
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div> */}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCloseFormModal}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 
                       transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-zentyal-primary text-white rounded-lg 
                       hover:bg-zentyal-dark transition-colors"
            >
              {isEditing ? "Update Client" : "Create Client"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Client"
        message={`Are you sure you want to delete ${deleteTarget?.name || "this client"}? This action cannot be undone.`}
        confirmText="Delete"
        requireReason={true}
        isLoading={false}
      />

      {/* Activate Confirmation Modal */}
      <ConfirmModal
        isOpen={showActivateModal}
        onClose={() => setShowActivateModal(false)}
        onConfirm={handleActivateConfirm}
        title="Activate Client"
        message={`Are you sure you want to activate ${activateTarget?.name || "this client"}?`}
        confirmText="Activate"
        requireReason={false}
        isLoading={false}
      />

      {/* Loading Modal */}
      <LoadingModal isOpen={showLoadingModal} message="Processing..." />

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: "" })}
        message={errorModal.message}
      />
    </div>
  );
}

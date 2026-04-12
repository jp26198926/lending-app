"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageAccess } from "@/hooks/usePageAccess";
import { useAuth } from "@/context/AuthContext";
import PageNotFound from "@/components/PageNotFound";
import { LoadingSpinner, StatusBadge } from "@/components/CRUDComponents";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import LoadingModal from "@/components/LoadingModal";
import DataTable, { Column } from "@/components/DataTable";

interface Permission {
  _id: string;
  permission: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function PermissionManagement() {
  const { loading: pageLoading, accessDenied } = usePageAccess();
  const { hasPermission } = useAuth();
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [formData, setFormData] = useState({ permission: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const canAdd = hasPermission("/admin/permission", "Add");
  const canEdit = hasPermission("/admin/permission", "Edit");
  const canDelete = hasPermission("/admin/permission", "Delete");

  useEffect(() => {
    fetchPermissions();
  }, []);

  if (pageLoading) return <LoadingSpinner />;
  if (accessDenied) return <PageNotFound />;

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/permission");
      if (!res.ok) throw new Error("Failed to fetch permissions");
      const data = await res.json();
      setPermissions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch permissions",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowLoadingModal(true);

    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { _id: editingId, ...formData } : formData;

      const res = await fetch("/api/admin/permission", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Operation failed");
      }

      setFormData({ permission: "" });
      setEditingId(null);
      setShowFormModal(false);
      await fetchPermissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setShowLoadingModal(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTarget(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (reason?: string) => {
    if (!deleteTarget || !reason) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/permission?_id=${deleteTarget}&deletedReason=${encodeURIComponent(reason)}`,
        { method: "DELETE" },
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete permission");
      }
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchPermissions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete permission",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (permissionItem: Permission) => {
    setFormData({ permission: permissionItem.permission });
    setEditingId(permissionItem._id);
    setShowFormModal(true);
    setError(null);
  };

  const resetForm = () => {
    setFormData({ permission: "" });
    setEditingId(null);
    setError(null);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    resetForm();
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 mt-10 md:mt-0">
            Permission
          </h1>
          <p className="text-gray-600">
            Manage system permissions and access controls
          </p>
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
            title="Add New Permission"
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
            <span className="hidden sm:inline">Add New Permission</span>
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Permissions Table with DataTable Component */}
      <DataTable
        data={permissions}
        columns={[
          {
            key: "permission",
            label: "Permission Name",
            sortable: true,
            render: (permission: Permission) => (
              <div className="flex items-center justify-end md:justify-start">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zentyal-primary/10 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-zentyal-primary"
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
                <span className="text-sm font-semibold text-gray-900">
                  {permission.permission}
                </span>
              </div>
            ),
            exportValue: (permission: Permission) => permission.permission,
          },
          {
            key: "status",
            label: "Status",
            sortable: true,
            render: (permission: Permission) => (
              <div className="flex justify-end md:justify-center">
                <StatusBadge status={permission.status} />
              </div>
            ),
            exportValue: (permission: Permission) => permission.status,
          },
          {
            key: "createdAt",
            label: "Created At",
            sortable: true,
            render: (permission: Permission) => (
              <span className="text-sm text-gray-600">
                {permission.createdAt
                  ? new Date(permission.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "N/A"}
              </span>
            ),
            exportValue: (permission: Permission) =>
              permission.createdAt
                ? new Date(permission.createdAt).toLocaleDateString()
                : "N/A",
          },
          {
            key: "actions",
            label: "Actions",
            sortable: false,
            searchable: false,
            render: (permission: Permission) => (
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <button
                  onClick={() =>
                    router.push(`/admin/permission/${permission._id}`)
                  }
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
                    onClick={() => handleEdit(permission)}
                    className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Edit Permission"
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
                {canDelete && (
                  <button
                    onClick={() => handleDeleteClick(permission._id)}
                    className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Permission"
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
              </div>
            ),
          },
        ]}
        loading={loading}
        emptyMessage="No permissions found"
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
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        }
        exportFileName="permissions"
        searchPlaceholder="Search permissions..."
        itemsPerPage={10}
      />

      {/* Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={handleCloseFormModal}
        title={editingId ? "Edit Permission" : "Create New Permission"}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permission Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.permission}
              onChange={(e) => setFormData({ permission: e.target.value })}
              required
              placeholder="Enter permission name (e.g., View, Add, Edit, Delete, Print)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                       focus:ring-zentyal-primary focus:border-transparent transition-all"
              autoFocus
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleCloseFormModal}
              className="px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 
                       transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark 
                       transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              {editingId ? "Update Permission" : "Create Permission"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Permission"
        message="Are you sure you want to delete this permission? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        requireReason={true}
        isLoading={loading}
      />

      {/* Loading Modal */}
      <LoadingModal
        isOpen={showLoadingModal}
        message={
          editingId ? "Updating permission..." : "Creating permission..."
        }
      />
    </div>
  );
}

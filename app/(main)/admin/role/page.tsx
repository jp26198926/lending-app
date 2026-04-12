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

interface Role {
  _id: string;
  role: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function RoleManagement() {
  const { loading: pageLoading, accessDenied } = usePageAccess();
  const { hasPermission } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState({ role: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const canAdd = hasPermission("/admin/role", "Add");
  const canEdit = hasPermission("/admin/role", "Edit");
  const canDelete = hasPermission("/admin/role", "Delete");

  useEffect(() => {
    fetchRoles();
  }, []);

  if (pageLoading) return <LoadingSpinner />;
  if (accessDenied) return <PageNotFound />;

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/role");
      if (!res.ok) throw new Error("Failed to fetch roles");
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch roles");
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

      const res = await fetch("/api/admin/role", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Operation failed");
      }

      setFormData({ role: "" });
      setEditingId(null);
      setShowFormModal(false);
      await fetchRoles();
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
        `/api/admin/role?_id=${deleteTarget}&deletedReason=${encodeURIComponent(reason)}`,
        { method: "DELETE" },
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete role");
      }
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete role");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role: Role) => {
    setFormData({ role: role.role });
    setEditingId(role._id);
    setShowFormModal(true);
    setError(null);
  };

  const resetForm = () => {
    setFormData({ role: "" });
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
            Role
          </h1>
          <p className="text-gray-600">Manage system roles and access levels</p>
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
            title="Add New Role"
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
            <span className="hidden sm:inline">Add New Role</span>
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

      {/* Roles Table with DataTable Component */}
      <DataTable
        data={roles}
        columns={[
          {
            key: "role",
            label: "Role Name",
            sortable: true,
            render: (role: Role) => (
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
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {role.role}
                </span>
              </div>
            ),
            exportValue: (role: Role) => role.role,
          },
          {
            key: "status",
            label: "Status",
            sortable: true,
            render: (role: Role) => (
              <div className="flex justify-end md:justify-center">
                <StatusBadge status={role.status} />
              </div>
            ),
            exportValue: (role: Role) => role.status,
          },
          {
            key: "createdAt",
            label: "Created At",
            sortable: true,
            render: (role: Role) => (
              <span className="text-sm text-gray-600">
                {role.createdAt
                  ? new Date(role.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "N/A"}
              </span>
            ),
            exportValue: (role: Role) =>
              role.createdAt
                ? new Date(role.createdAt).toLocaleDateString()
                : "N/A",
          },
          {
            key: "actions",
            label: "Actions",
            sortable: false,
            searchable: false,
            render: (role: Role) => (
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <button
                  onClick={() => router.push(`/admin/role/${role._id}`)}
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
                    onClick={() => handleEdit(role)}
                    className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Edit Role"
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
                    onClick={() => handleDeleteClick(role._id)}
                    className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Role"
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
        emptyMessage="No roles found"
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
        exportFileName="roles"
        searchPlaceholder="Search roles..."
        itemsPerPage={10}
      />

      {/* Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={handleCloseFormModal}
        title={editingId ? "Edit Role" : "Create New Role"}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ role: e.target.value })}
              required
              placeholder="Enter role name (e.g., Admin, Manager, Staff)"
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
              {editingId ? "Update Role" : "Create Role"}
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
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        requireReason={true}
        isLoading={loading}
      />

      {/* Loading Modal */}
      <LoadingModal
        isOpen={showLoadingModal}
        message={editingId ? "Updating role..." : "Creating role..."}
      />
    </div>
  );
}

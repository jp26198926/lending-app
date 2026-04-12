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
}

interface Permission {
  _id: string;
  permission: string;
  status: string;
}

interface PageModel {
  _id: string;
  page: string;
  path: string;
  status: string;
}

interface RolePermission {
  _id: string;
  roleId: {
    _id: string;
    role: string;
    status: string;
  };
  pageId?: {
    _id: string;
    page: string;
    path: string;
    status: string;
  };
  permissionId: {
    _id: string;
    permission: string;
    status: string;
  };
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function RolePermissionManagement() {
  const { loading: pageLoading, accessDenied } = usePageAccess();
  const { hasPermission } = useAuth();
  const router = useRouter();
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [pages, setPages] = useState<PageModel[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [formData, setFormData] = useState({
    roleId: "",
    pageId: "",
    permissionId: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [filterRoleId, setFilterRoleId] = useState<string>("");

  const canAdd = hasPermission("/admin/rolepermission", "Add");
  const canEdit = hasPermission("/admin/rolepermission", "Edit");
  const canDelete = hasPermission("/admin/rolepermission", "Delete");

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchRolePermissions(),
        fetchRoles(),
        fetchPages(),
        fetchPermissions(),
      ]);
    };
    loadData();
  }, []);

  if (pageLoading) return <LoadingSpinner />;
  if (accessDenied) return <PageNotFound />;

  const fetchRolePermissions = async (roleIdFilter?: string) => {
    try {
      setLoading(true);
      setError(null);
      const url = roleIdFilter
        ? `/api/admin/rolepermission?roleId=${roleIdFilter}`
        : "/api/admin/rolepermission";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch assignments");
      const data = await res.json();
      setRolePermissions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch assignments",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/admin/role");
      if (!res.ok) throw new Error("Failed to fetch roles");
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/admin/page");
      if (!res.ok) throw new Error("Failed to fetch pages");
      const data = await res.json();
      setPages(data);
    } catch (err) {
      console.error("Error fetching pages:", err);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await fetch("/api/admin/permission");
      if (!res.ok) throw new Error("Failed to fetch permissions");
      const data = await res.json();
      setPermissions(data);
    } catch (err) {
      console.error("Error fetching permissions:", err);
    }
  };

  const handleFilterChange = (roleId: string) => {
    setFilterRoleId(roleId);
    fetchRolePermissions(roleId || undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.roleId || !formData.pageId || !formData.permissionId) {
      setError("Please select role, page, and permission");
      return;
    }

    setLoading(true);
    setShowLoadingModal(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { _id: editingId, ...formData } : formData;

      const res = await fetch("/api/admin/rolepermission", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Operation failed");
      }

      setFormData({ roleId: "", pageId: "", permissionId: "" });
      setEditingId(null);
      setShowFormModal(false);
      await fetchRolePermissions(filterRoleId || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setLoading(false);
      setShowLoadingModal(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteTarget({ id, name });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (reason: string) => {
    if (!deleteTarget) return;

    setShowDeleteModal(false);
    setShowLoadingModal(true);

    try {
      const res = await fetch(
        `/api/admin/rolepermission?_id=${deleteTarget.id}&deletedReason=${encodeURIComponent(reason)}`,
        { method: "DELETE" },
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete assignment");
      }
      await fetchRolePermissions(filterRoleId || undefined);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete assignment",
      );
    } finally {
      setShowLoadingModal(false);
      setDeleteTarget(null);
    }
  };

  const handleEdit = (assignment: RolePermission) => {
    setFormData({
      roleId: assignment.roleId._id,
      pageId: assignment.pageId?._id || "",
      permissionId: assignment.permissionId._id,
    });
    setEditingId(assignment._id);
    setShowFormModal(true);
    setError(null);
  };

  const handleCloseFormModal = () => {
    resetForm();
    setShowFormModal(false);
  };

  const resetForm = () => {
    setFormData({ roleId: "", pageId: "", permissionId: "" });
    setEditingId(null);
    setError(null);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 mt-10 md:mt-0">
            Role Permission
          </h1>
          <p className="text-gray-600">
            Assign permissions to roles for specific pages
          </p>
        </div>
        {canAdd && !showFormModal && (
          <button
            onClick={() => {
              resetForm();
              setShowFormModal(true);
            }}
            className="px-3 sm:px-6 py-3 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark 
                     transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105
                     flex items-center space-x-2"
            title="New Assignment"
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
            <span className="hidden sm:inline">New Assignment</span>
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

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-200">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-zentyal-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <label className="text-sm font-semibold text-gray-700">
            Filter by Role:
          </label>
          <select
            value={filterRoleId}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                     focus:ring-zentyal-primary focus:border-transparent transition-all"
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role._id} value={role._id}>
                {role.role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments Table with DataTable Component */}
      <DataTable
        data={rolePermissions}
        columns={[
          {
            key: "roleId",
            label: "Role",
            sortable: true,
            render: (assignment: RolePermission) => (
              <div className="flex items-center justify-end md:justify-center">
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
                  {assignment.roleId.role}
                </span>
              </div>
            ),
            exportValue: (assignment: RolePermission) => assignment.roleId.role,
          },
          {
            key: "pageId",
            label: "Page",
            sortable: true,
            render: (assignment: RolePermission) =>
              assignment.pageId ? (
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {assignment.pageId.page}
                  </p>
                  <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-zentyal-primary">
                    {assignment.pageId.path}
                  </code>
                </div>
              ) : (
                <span className="text-gray-400 italic text-sm">
                  No page assigned
                </span>
              ),
            exportValue: (assignment: RolePermission) =>
              assignment.pageId
                ? `${assignment.pageId.page} (${assignment.pageId.path})`
                : "No page assigned",
          },
          {
            key: "permissionId",
            label: "Permission",
            sortable: true,
            render: (assignment: RolePermission) => (
              <div className="flex justify-end md:justify-center">
                <span className="inline-block px-2 sm:px-3 py-1 bg-zentyal-accent/10 text-zentyal-accent font-semibold rounded-full text-xs">
                  {assignment.permissionId.permission}
                </span>
              </div>
            ),
            exportValue: (assignment: RolePermission) =>
              assignment.permissionId.permission,
          },
          {
            key: "status",
            label: "Status",
            sortable: true,
            render: (assignment: RolePermission) => (
              <div className="flex justify-end md:justify-center">
                <StatusBadge status={assignment.status} />
              </div>
            ),
            exportValue: (assignment: RolePermission) => assignment.status,
          },
          {
            key: "createdAt",
            label: "Created At",
            sortable: true,
            render: (assignment: RolePermission) => (
              <span className="text-sm text-gray-600">
                {assignment.createdAt
                  ? new Date(assignment.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "N/A"}
              </span>
            ),
            exportValue: (assignment: RolePermission) =>
              assignment.createdAt
                ? new Date(assignment.createdAt).toLocaleDateString()
                : "N/A",
          },
          {
            key: "actions",
            label: "Actions",
            sortable: false,
            searchable: false,
            render: (assignment: RolePermission) => (
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <button
                  onClick={() =>
                    router.push(`/admin/rolepermission/${assignment._id}`)
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
                    onClick={() => handleEdit(assignment)}
                    className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Edit Assignment"
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
                    onClick={() =>
                      handleDeleteClick(
                        assignment._id,
                        `${assignment.roleId.role} → ${assignment.pageId?.page || "N/A"} → ${assignment.permissionId.permission}`,
                      )
                    }
                    className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Assignment"
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
        emptyMessage="No assignments found"
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        }
        exportFileName="role-permissions"
        searchPlaceholder="Search assignments..."
        itemsPerPage={10}
      />

      {/* Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={handleCloseFormModal}
        title={editingId ? "Edit Assignment" : "Create New Assignment"}
        size="lg"
      >
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

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.roleId}
                onChange={(e) =>
                  setFormData({ ...formData, roleId: e.target.value })
                }
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Page */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.pageId}
                onChange={(e) =>
                  setFormData({ ...formData, pageId: e.target.value })
                }
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              >
                <option value="">Select a page</option>
                {pages.map((page) => (
                  <option key={page._id} value={page._id}>
                    {page.page} ({page.path})
                  </option>
                ))}
              </select>
            </div>

            {/* Permission */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permission <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.permissionId}
                onChange={(e) =>
                  setFormData({ ...formData, permissionId: e.target.value })
                }
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              >
                <option value="">Select a permission</option>
                {permissions.map((permission) => (
                  <option key={permission._id} value={permission._id}>
                    {permission.permission}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200
                ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-zentyal-primary hover:bg-zentyal-dark shadow-lg hover:shadow-xl transform hover:scale-105"
                }`}
            >
              {loading
                ? "Processing..."
                : editingId
                  ? "Update Assignment"
                  : "Create Assignment"}
            </button>
            <button
              type="button"
              onClick={handleCloseFormModal}
              className="px-8 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 
                       transition-all duration-200 font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Assignment"
        message={`Are you sure you want to delete this assignment: ${deleteTarget?.name}?`}
        confirmText="Delete Assignment"
        requireReason={true}
      />

      {/* Loading Modal */}
      <LoadingModal
        isOpen={showLoadingModal}
        message={loading ? "Processing..." : "Deleting assignment..."}
      />
    </div>
  );
}

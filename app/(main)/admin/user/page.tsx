"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageAccess } from "@/hooks/usePageAccess";
import { useAuth } from "@/context/AuthContext";
import PageNotFound from "@/components/PageNotFound";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import LoadingModal from "@/components/LoadingModal";
import DataTable, { Column } from "@/components/DataTable";

interface Role {
  _id: string;
  role: string;
  status: string;
}

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roleId: {
    _id: string;
    role: string;
    status: string;
  };
  rate: number;
  cashReceivable: number;
  capitalContribution: number;
  profitEarned: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function UserPage() {
  const router = useRouter();
  const { loading: pageLoading, accessDenied } = usePageAccess();
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState({
    _id: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    roleId: "",
    rate: 0,
    cashReceivable: 0,
    capitalContribution: 0,
    profitEarned: 0,
    status: "ACTIVE",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const canAdd = hasPermission("/admin/user", "Add");
  const canEdit = hasPermission("/admin/user", "Edit");
  const canDelete = hasPermission("/admin/user", "Delete");

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchUsers(), fetchRoles()]);
    };
    fetchData();
  }, []);

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

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/user");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Failed to fetch users");
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/admin/role");
      const data = await res.json();
      setRoles(data.filter((r: Role) => r.status === "ACTIVE"));
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowLoadingModal(true);

    try {
      const url = "/api/admin/user";
      const method = isEditing ? "PUT" : "POST";

      const payload: any = { ...formData };
      if (isEditing && !payload.password) {
        delete payload.password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(
          isEditing ? "User updated successfully" : "User created successfully",
        );
        resetForm();
        fetchUsers();
        setShowFormModal(false);
      } else {
        const error = await res.json();
        alert(error.error || "Operation failed");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred");
    } finally {
      setLoading(false);
      setShowLoadingModal(false);
    }
  };

  const handleEdit = (user: User) => {
    setFormData({
      _id: user._id,
      email: user.email,
      password: "",
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      roleId: user.roleId._id,
      rate: user.rate,
      cashReceivable: user.cashReceivable,
      capitalContribution: user.capitalContribution,
      profitEarned: user.profitEarned,
      status: user.status,
    });
    setIsEditing(true);
    setShowFormModal(true);
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
        `/api/admin/user?_id=${deleteTarget.id}&deletedReason=${encodeURIComponent(reason)}`,
        { method: "DELETE" },
      );

      if (res.ok) {
        alert("User deleted successfully");
        fetchUsers();
      } else {
        const error = await res.json();
        alert(error.error || "Delete failed");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred");
    } finally {
      setShowLoadingModal(false);
      setDeleteTarget(null);
    }
  };

  const handleCloseFormModal = () => {
    resetForm();
    setShowFormModal(false);
  };

  const resetForm = () => {
    setFormData({
      _id: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      roleId: "",
      rate: 0,
      cashReceivable: 0,
      capitalContribution: 0,
      profitEarned: 0,
      status: "ACTIVE",
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 mt-10 md:mt-0">
            User
          </h1>
          <p className="text-gray-600">
            Manage system users and their permissions
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
            title="Add New User"
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
            <span className="hidden sm:inline">Add New User</span>
          </button>
        )}
      </div>

      {/* Users Table with DataTable Component */}
      <DataTable
        data={users}
        columns={[
          {
            key: "email",
            label: "Email",
            sortable: true,
            render: (user: User) => (
              <span className="text-sm text-gray-900">{user.email}</span>
            ),
            exportValue: (user: User) => user.email,
          },
          {
            key: "name",
            label: "Name",
            sortable: true,
            render: (user: User) => (
              <span className="text-sm font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </span>
            ),
            exportValue: (user: User) => `${user.firstName} ${user.lastName}`,
          },
          {
            key: "phone",
            label: "Phone",
            sortable: true,
            render: (user: User) => (
              <span className="text-sm text-gray-600">{user.phone}</span>
            ),
            exportValue: (user: User) => user.phone,
          },
          {
            key: "role",
            label: "Role",
            sortable: true,
            render: (user: User) => (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-zentyal-primary/10 text-zentyal-primary">
                {user.roleId.role}
              </span>
            ),
            exportValue: (user: User) => user.roleId.role,
          },
          {
            key: "rate",
            label: "Rate",
            sortable: true,
            render: (user: User) => (
              <div className="text-right">
                <span className="text-sm text-gray-900 font-mono">
                  {user.rate.toFixed(2)}%
                </span>
              </div>
            ),
            exportValue: (user: User) => `${user.rate.toFixed(2)}%`,
          },
          {
            key: "cashReceivable",
            label: "Cash Receivable",
            sortable: true,
            render: (user: User) => (
              <div className="text-right">
                <span className="text-sm text-gray-900 font-mono">
                  {user.cashReceivable.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            ),
            exportValue: (user: User) =>
              `${user.cashReceivable.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
          },
          {
            key: "status",
            label: "Status",
            sortable: true,
            render: (user: User) => (
              <div className="flex justify-end md:justify-center">
                <span
                  className={`inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full
                    ${
                      user.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                >
                  {user.status}
                </span>
              </div>
            ),
            exportValue: (user: User) => user.status,
          },
          {
            key: "actions",
            label: "Actions",
            sortable: false,
            searchable: false,
            render: (user: User) => (
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <button
                  onClick={() => router.push(`/admin/user/${user._id}`)}
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
                    onClick={() => handleEdit(user)}
                    className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Edit User"
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
                        user._id,
                        `${user.firstName} ${user.lastName}`,
                      )
                    }
                    className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete User"
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
        emptyMessage="No users found"
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        }
        exportFileName="users"
        searchPlaceholder="Search users..."
        itemsPerPage={10}
      />

      {/* Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={handleCloseFormModal}
        title={isEditing ? "Edit User" : "Create New User"}
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
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
                placeholder="user@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password {!isEditing && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required={!isEditing}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
                placeholder={
                  isEditing ? "Leave blank to keep current" : "Enter password"
                }
              />
            </div>

            {/* First Name */}
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
              />
            </div>

            {/* Last Name */}
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
              />
            </div>

            {/* Phone */}
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
              />
            </div>

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

            {/* Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({ ...formData, rate: Number(e.target.value) })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Cash Receivable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cash Receivable ()
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cashReceivable}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cashReceivable: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Capital Contribution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capital Contribution ()
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.capitalContribution}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capitalContribution: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Profit Earned */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profit Earned ()
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.profitEarned}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profitEarned: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex gap-3">
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
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : isEditing ? (
                "Update User"
              ) : (
                "Create User"
              )}
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
        title="Delete User"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        confirmText="Delete User"
        requireReason={true}
      />

      {/* Loading Modal */}
      <LoadingModal
        isOpen={showLoadingModal}
        message={loading ? "Processing..." : "Deleting user..."}
      />
    </div>
  );
}

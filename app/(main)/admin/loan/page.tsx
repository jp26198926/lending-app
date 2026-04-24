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
  email: string;
  phone: string;
  address: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Loan {
  _id: string;
  loanNo: string;
  clientId: Client;
  principal: number;
  interestRate: number;
  terms: string;
  dateStarted: string;
  assignedStaff: User;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function LoanPage() {
  const router = useRouter();
  const { loading: pageLoading, accessDenied } = usePageAccess();
  const { hasPermission, user: currentUser } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    _id: "",
    clientId: "",
    principal: 0,
    interestRate: 30,
    terms: "Fortnightly",
    dateStarted: new Date().toISOString().split("T")[0],
    assignedStaff: "",
    status: "Active",
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
  const [hasActiveCycles, setHasActiveCycles] = useState(false);
  const [loansWithActiveCycles, setLoansWithActiveCycles] = useState<
    Set<string>
  >(new Set());

  const canAdd = hasPermission("/admin/loan", "Add");
  const canEdit = hasPermission("/admin/loan", "Edit");
  const canDelete = hasPermission("/admin/loan", "Delete");

  const fetchLoans = async () => {
    try {
      const res = await fetch("/api/admin/loan");
      const data = await res.json();
      setLoans(data);
      // Check which loans have active cycles
      await checkAllLoansForActiveCycles();
    } catch (error) {
      console.error("Error fetching loans:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to fetch loans. Please try again.",
      });
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/admin/client");
      const data = await res.json();
      setClients(
        data.filter((c: Client & { status: string }) => c.status === "ACTIVE"),
      );
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/user");
      const data = await res.json();
      setUsers(
        data.filter((u: User & { status: string }) => u.status === "ACTIVE"),
      );
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const checkForActiveCycles = async (loanId: string) => {
    try {
      const res = await fetch(`/api/admin/cycle?loanId=${loanId}`);
      if (res.ok) {
        const cycles = await res.json();
        // Check if any cycle has "Active" status
        const hasActive = cycles.some(
          (cycle: { status: string }) => cycle.status === "Active",
        );
        setHasActiveCycles(hasActive);
        return hasActive;
      }
    } catch (error) {
      console.error("Error checking for active cycles:", error);
    }
    return false;
  };

  const checkAllLoansForActiveCycles = async () => {
    try {
      // Fetch all cycles at once
      const res = await fetch("/api/admin/cycle");
      if (res.ok) {
        const allCycles = await res.json();

        // Create a set of loan IDs that have active cycles
        const loansWithActive = new Set<string>();
        allCycles.forEach(
          (cycle: { loanId: { _id: string }; status: string }) => {
            if (cycle.status === "Active" && cycle.loanId?._id) {
              loansWithActive.add(cycle.loanId._id);
            }
          },
        );

        setLoansWithActiveCycles(loansWithActive);
      }
    } catch (error) {
      console.error("Error checking loans for active cycles:", error);
    }
  };

  const handleAdvancedSearch = async (filters: Record<string, string>) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const url = `/api/admin/loan${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setLoans(data);
    } catch (error) {
      console.error("Error fetching loans:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to fetch loans. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchLoans(), fetchClients(), fetchUsers()]);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowLoadingModal(true);

    try {
      const url = isEditing
        ? `/api/admin/loan/${formData._id}`
        : "/api/admin/loan";
      const method = isEditing ? "PUT" : "POST";

      const payload = {
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
            ? "Loan updated successfully! ✅"
            : "Loan created successfully! 🎉",
        );
        resetForm();
        fetchLoans();
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

  const handleEdit = async (loan: Loan) => {
    setFormData({
      _id: loan._id,
      clientId: loan.clientId._id,
      principal: loan.principal,
      interestRate: loan.interestRate,
      terms: loan.terms,
      dateStarted: new Date(loan.dateStarted).toISOString().split("T")[0],
      assignedStaff: loan.assignedStaff._id,
      status: loan.status,
    });
    setIsEditing(true);
    // Check for active cycles before showing modal
    await checkForActiveCycles(loan._id);
    setShowFormModal(true);
  };

  const handleDeleteClick = (id: string, name: string) => {
    // Check if loan has active cycles
    if (loansWithActiveCycles.has(id)) {
      setErrorModal({
        isOpen: true,
        message:
          "Cannot delete this loan because it has active cycles. Please complete or cancel all active cycles first.",
      });
      return;
    }

    setDeleteTarget({ id, name });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (reason?: string) => {
    if (!deleteTarget || !reason) return;

    setShowDeleteModal(false);
    setShowLoadingModal(true);

    try {
      const res = await fetch(
        `/api/admin/loan/${deleteTarget.id}?deletedBy=${currentUser?._id}&deletedReason=${encodeURIComponent(reason)}`,
        { method: "DELETE" },
      );

      if (res.ok) {
        toast.success("Loan deleted successfully! 🗑️");
        fetchLoans();
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
      const res = await fetch(`/api/admin/loan/${activateTarget.id}`, {
        method: "PATCH",
      });

      if (res.ok) {
        toast.success(
          `Loan "${activateTarget.name}" activated successfully! ✅`,
        );
        fetchLoans();
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
    setHasActiveCycles(false);
    setShowFormModal(false);
  };

  const resetForm = () => {
    setFormData({
      _id: "",
      clientId: "",
      principal: 0,
      interestRate: 30,
      terms: "Fortnightly",
      dateStarted: new Date().toISOString().split("T")[0],
      assignedStaff: "",
      status: "Active",
    });
    setIsEditing(false);
    setHasActiveCycles(false);
  };

  const getClientFullName = (client: Client) => {
    const parts = [client.firstName];
    if (client.middleName) parts.push(client.middleName);
    parts.push(client.lastName);
    return parts.join(" ");
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 mt-10 md:mt-0">
            Loan Management
          </h1>
          <p className="text-gray-600">
            Manage loans and track lending records
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
            title="Add New Loan"
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
            <span className="hidden sm:inline">Add New Loan</span>
          </button>
        )}
      </div>

      {/* Loans Table with DataTable Component */}
      <DataTable
        data={loans}
        columns={[
          {
            key: "loanNo",
            label: "Loan No.",
            sortable: true,
            searchable: true,
            render: (loan: Loan) => (
              <span className="text-sm font-semibold text-zentyal-primary">
                {loan.loanNo}
              </span>
            ),
            exportValue: (loan: Loan) => loan.loanNo,
          },
          {
            key: "clientName",
            label: "Client",
            sortable: true,
            searchable: true,
            render: (loan: Loan) => (
              <span className="text-sm font-medium text-gray-900">
                {getClientFullName(loan.clientId)}
              </span>
            ),
            exportValue: (loan: Loan) => getClientFullName(loan.clientId),
          },
          {
            key: "principal",
            label: "Principal",
            sortable: true,
            render: (loan: Loan) => (
              <div className="text-right">
                <span className="text-sm text-gray-900 font-mono">
                  {loan.principal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            ),
            exportValue: (loan: Loan) =>
              `${loan.principal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
          },
          {
            key: "interestRate",
            label: "Interest Rate",
            sortable: true,
            render: (loan: Loan) => (
              <div className="text-right">
                <span className="text-sm text-gray-900 font-mono">
                  {loan.interestRate.toFixed(2)}%
                </span>
              </div>
            ),
            exportValue: (loan: Loan) => `${loan.interestRate.toFixed(2)}%`,
          },
          {
            key: "terms",
            label: "Terms",
            sortable: true,
            searchable: true,
            render: (loan: Loan) => (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                {loan.terms}
              </span>
            ),
            exportValue: (loan: Loan) => loan.terms,
          },
          {
            key: "dateStarted",
            label: "Date Started",
            sortable: true,
            render: (loan: Loan) => (
              <span className="text-sm text-gray-600">
                {new Date(loan.dateStarted).toISOString().split("T")[0]}
              </span>
            ),
            exportValue: (loan: Loan) =>
              new Date(loan.dateStarted).toISOString().split("T")[0],
          },
          {
            key: "assignedStaff",
            label: "Assigned Staff",
            sortable: true,
            searchable: true,
            render: (loan: Loan) => (
              <span className="text-sm text-gray-900">
                {loan.assignedStaff.firstName} {loan.assignedStaff.lastName}
              </span>
            ),
            exportValue: (loan: Loan) =>
              `${loan.assignedStaff.firstName} ${loan.assignedStaff.lastName}`,
          },
          {
            key: "status",
            label: "Status",
            sortable: true,
            render: (loan: Loan) => (
              <div className="flex justify-end md:justify-center">
                <span
                  className={`inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full
                    ${
                      loan.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : loan.status === "Completed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                    }`}
                >
                  {loan.status}
                </span>
              </div>
            ),
            exportValue: (loan: Loan) => loan.status,
          },
          {
            key: "actions",
            label: "Actions",
            sortable: false,
            searchable: false,
            render: (loan: Loan) => (
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <button
                  onClick={() => router.push(`/admin/loan/${loan._id}`)}
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
                {canEdit && loan.status !== "Cancelled" && (
                  <button
                    onClick={() => handleEdit(loan)}
                    className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Edit Loan"
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
                {canDelete &&
                  loan.status === "Active" &&
                  !loansWithActiveCycles.has(loan._id) && (
                    <button
                      onClick={() =>
                        handleDeleteClick(
                          loan._id,
                          `Loan for ${getClientFullName(loan.clientId)}`,
                        )
                      }
                      className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancel Loan"
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
                  (loan.status === "Cancelled" ||
                    loan.status === "Completed") && (
                    <button
                      onClick={() =>
                        handleActivateClick(
                          loan._id,
                          `Loan for ${getClientFullName(loan.clientId)}`,
                        )
                      }
                      className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Activate Loan"
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
        emptyMessage="No loans found"
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
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        }
        exportFileName="loans"
        searchPlaceholder="Search loans..."
        itemsPerPage={10}
        onAdvancedSearch={handleAdvancedSearch}
      />

      {/* Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={handleCloseFormModal}
        title={isEditing ? "Edit Loan" : "Create New Loan"}
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.clientId}
                onChange={(e) =>
                  setFormData({ ...formData, clientId: e.target.value })
                }
                required
                disabled={isEditing && hasActiveCycles}
                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all
                         ${isEditing && hasActiveCycles ? "bg-gray-100 cursor-not-allowed" : ""}`}
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {getClientFullName(client)}
                  </option>
                ))}
              </select>
              {isEditing && hasActiveCycles && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ Cannot edit - loan has active cycles
                </p>
              )}
            </div>

            {/* Principal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Principal Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.principal}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    principal: Number(e.target.value),
                  })
                }
                required
                disabled={isEditing && hasActiveCycles}
                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all
                         ${isEditing && hasActiveCycles ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="0.00"
              />
              {isEditing && hasActiveCycles && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ Cannot edit - loan has active cycles
                </p>
              )}
            </div>

            {/* Interest Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interest Rate (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.interestRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    interestRate: Number(e.target.value),
                  })
                }
                required
                disabled={isEditing && hasActiveCycles}
                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all
                         ${isEditing && hasActiveCycles ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="0.00"
              />
              {isEditing && hasActiveCycles && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ Cannot edit - loan has active cycles
                </p>
              )}
            </div>

            {/* Terms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terms <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.terms}
                onChange={(e) =>
                  setFormData({ ...formData, terms: e.target.value })
                }
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              >
                <option value="Weekly">Weekly</option>
                <option value="Fortnightly">Fortnightly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            {/* Date Started */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Started <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dateStarted}
                onChange={(e) =>
                  setFormData({ ...formData, dateStarted: e.target.value })
                }
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Assigned Staff */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Staff <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.assignedStaff}
                onChange={(e) =>
                  setFormData({ ...formData, assignedStaff: e.target.value })
                }
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              >
                <option value="">Select staff</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
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
                "Update Loan"
              ) : (
                "Create Loan"
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
        title="Cancel Loan"
        message={`Are you sure you want to cancel ${deleteTarget?.name}? This action cannot be undone.`}
        confirmText="Cancel Loan"
        requireReason={true}
      />

      {/* Activate Confirmation Modal */}
      <ConfirmModal
        isOpen={showActivateModal}
        onClose={() => setShowActivateModal(false)}
        onConfirm={handleActivateConfirm}
        title="Activate Loan"
        message={`Are you sure you want to activate ${activateTarget?.name}?`}
        confirmText="Activate"
        requireReason={false}
      />

      {/* Loading Modal */}
      <LoadingModal
        isOpen={showLoadingModal}
        message={loading ? "Processing..." : "Updating loan..."}
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

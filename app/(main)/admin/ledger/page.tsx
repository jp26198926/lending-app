"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageAccess } from "@/hooks/usePageAccess";
import { useAuth } from "@/context/AuthContext";
import PageNotFound from "@/components/PageNotFound";
import Modal from "@/components/Modal";
import LoadingModal from "@/components/LoadingModal";
import ErrorModal from "@/components/ErrorModal";
import DataTable from "@/components/DataTable";
import toast from "react-hot-toast";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Client {
  _id: string;
  firstName: string;
  middleName?: string;
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
  status: string;
}

interface Cycle {
  _id: string;
  cycleCount: number;
  totalDue: number;
  totalPaid: number;
  balance: number;
  dateDue: string;
  status: string;
}

interface Payment {
  _id: string;
  paymentNo: string;
  amount: number;
  datePaid: string;
  status: string;
}

interface Ledger {
  _id: string;
  date: string;
  userId?: User;
  type: string;
  direction: string;
  amount: number;
  loanId?: Loan;
  cycleId?: Cycle;
  paymentId?: Payment;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
  updatedBy?: User;
}

export default function LedgerPage() {
  const router = useRouter();
  const { loading: pageLoading, accessDenied } = usePageAccess();
  const { hasPermission, user: currentUser } = useAuth();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    _id: "",
    date: new Date().toISOString().split("T")[0],
    userId: "",
    type: "Capital In",
    direction: "In",
    amount: 0,
    description: "",
    status: "Completed",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);

  // Helper function to format date to YYYY-MM-DD
  const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: "",
  });

  const canAdd = hasPermission("/admin/ledger", "Add");

  const fetchLedgers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/ledger");
      const data = await res.json();
      setLedgers(data);
    } catch (error) {
      console.error("Error fetching ledger entries:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to fetch ledger entries. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/user");
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchUsers();
      await fetchLedgers();
    };
    fetchData();
  }, []);

  // Auto-set direction based on type
  useEffect(() => {
    const newDirection =
      formData.type === "Capital In" || formData.type === "Repayment"
        ? "In"
        : "Out";
    if (formData.direction !== newDirection) {
      setFormData((prev) => ({ ...prev, direction: newDirection }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.type]);

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
        ? `/api/admin/ledger/${formData._id}`
        : "/api/admin/ledger";
      const method = isEditing ? "PUT" : "POST";

      const payload = {
        ...formData,
        userId: formData.userId || undefined,
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
            ? "Ledger entry updated successfully! ✅"
            : "Ledger entry created successfully! 🎉",
        );
        resetForm();
        fetchLedgers();
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

  const handleCloseFormModal = () => {
    resetForm();
    setShowFormModal(false);
  };

  const resetForm = () => {
    setFormData({
      _id: "",
      date: new Date().toISOString().split("T")[0],
      userId: "",
      type: "Capital In",
      direction: "In",
      amount: 0,
      description: "",
      status: "Completed",
    });
    setIsEditing(false);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      Completed: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}
      >
        {status}
      </span>
    );
  };

  const getDirectionBadge = (direction: string) => {
    const directionColors = {
      In: "bg-blue-100 text-blue-800",
      Out: "bg-orange-100 text-orange-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${directionColors[direction as keyof typeof directionColors] || "bg-gray-100 text-gray-800"}`}
      >
        {direction}
      </span>
    );
  };

  const getUserFullName = (user: User) => {
    return `${user.firstName} ${user.lastName}`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 mt-10 md:mt-0">
              Ledger Management
            </h1>
            <p className="text-gray-600">
              Track all financial transactions and entries
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
              title="Add Capital In Entry"
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
              <span className="hidden sm:inline">Add Capital In</span>
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table with DataTable Component */}
      <DataTable
        data={ledgers}
        columns={[
          {
            key: "date",
            label: "Date",
            sortable: true,
            render: (ledger: Ledger) => (
              <span className="text-sm text-gray-900">
                {formatDate(ledger.date)}
              </span>
            ),
            exportValue: (ledger: Ledger) => formatDate(ledger.date),
          },
          {
            key: "type",
            label: "Type",
            sortable: true,
            searchable: true,
            render: (ledger: Ledger) => (
              <span className="text-sm text-gray-900 font-medium">
                {ledger.type}
              </span>
            ),
          },
          {
            key: "direction",
            label: "Direction",
            sortable: true,
            searchable: true,
            render: (ledger: Ledger) => getDirectionBadge(ledger.direction),
          },
          {
            key: "amount",
            label: "Amount",
            sortable: true,
            render: (ledger: Ledger) => (
              <div className="text-right">
                <span
                  className={`text-sm font-mono font-medium ${
                    ledger.direction === "In"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {ledger.direction === "In" ? "+" : "-"}
                  {ledger.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            ),
            exportValue: (ledger: Ledger) => ledger.amount.toFixed(2),
          },
          {
            key: "user",
            label: "User",
            sortable: true,
            searchable: true,
            render: (ledger: Ledger) => (
              <span className="text-sm text-gray-700">
                {ledger.userId ? (
                  getUserFullName(ledger.userId)
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </span>
            ),
            exportValue: (ledger: Ledger) =>
              ledger.userId ? getUserFullName(ledger.userId) : "N/A",
          },
          {
            key: "loan",
            label: "Loan",
            sortable: true,
            searchable: true,
            render: (ledger: Ledger) => (
              <span className="text-sm text-gray-700">
                {ledger.loanId ? (
                  ledger.loanId.loanNo
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </span>
            ),
            exportValue: (ledger: Ledger) =>
              ledger.loanId ? ledger.loanId.loanNo : "N/A",
          },
          {
            key: "description",
            label: "Description",
            sortable: false,
            searchable: true,
            render: (ledger: Ledger) => (
              <span className="text-sm text-gray-600 max-w-xs truncate block">
                {ledger.description || (
                  <span className="text-gray-400">No description</span>
                )}
              </span>
            ),
          },
          {
            key: "status",
            label: "Status",
            sortable: true,
            searchable: true,
            render: (ledger: Ledger) => getStatusBadge(ledger.status),
          },
          {
            key: "actions",
            label: "Actions",
            sortable: false,
            searchable: false,
            render: (ledger: Ledger) => (
              <div className="flex items-center justify-end md:justify-center gap-2">
                <button
                  onClick={() => router.push(`/admin/ledger/${ledger._id}`)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="View Details"
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
              </div>
            ),
          },
        ]}
        itemsPerPage={10}
        loading={loading}
        emptyMessage="No ledger entries found"
        exportFileName="ledger-export"
        searchPlaceholder="Search ledger entries..."
        onRowClick={(ledger) => router.push(`/admin/ledger/${ledger._id}`)}
      />

      {/* Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={handleCloseFormModal}
        title={isEditing ? "Edit Ledger Entry" : "Add Capital In Entry"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.type}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 
                         text-gray-600 cursor-not-allowed"
                disabled
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">
                Only Capital In transactions allowed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Direction <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.direction}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 
                         text-gray-600 cursor-not-allowed"
                disabled
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">
                Auto-set based on type
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit From
              </label>
              <select
                value={formData.userId}
                onChange={(e) =>
                  setFormData({ ...formData, userId: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              >
                <option value="">Select User (Optional)</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {getUserFullName(user)}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                placeholder="Add any notes or description about this entry..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 ">
            <button
              type="button"
              onClick={handleCloseFormModal}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 
                       transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark 
                       transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing ? "Update Entry" : "Create Entry"}
            </button>
          </div>
        </form>
      </Modal>

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

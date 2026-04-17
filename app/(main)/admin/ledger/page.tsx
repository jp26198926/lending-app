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
  const [loans, setLoans] = useState<Loan[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [formData, setFormData] = useState({
    _id: "",
    date: new Date().toISOString().split("T")[0],
    userId: "",
    type: "Capital In",
    direction: "In",
    amount: 0,
    loanId: "",
    cycleId: "",
    paymentId: "",
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: "",
  });

  const canAdd = hasPermission("/admin/ledger", "Add");
  const canEdit = hasPermission("/admin/ledger", "Edit");
  const canDelete = hasPermission("/admin/ledger", "Delete");

  const ledgerTypes = [
    "Capital In",
    "Loan Release",
    "Repayment",
    "Expense",
    "Withdrawal",
  ];
  const ledgerDirections = ["In", "Out"];

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

  const fetchLoans = async () => {
    try {
      const res = await fetch("/api/admin/loan");
      if (!res.ok) return;
      const data = await res.json();
      setLoans(data);
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  };

  const fetchCycles = async (loanId: string) => {
    if (!loanId) {
      setCycles([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/cycle?loanId=${loanId}`);
      if (!res.ok) return;
      const data = await res.json();
      setCycles(data);
    } catch (error) {
      console.error("Error fetching cycles:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/admin/payment");
      if (!res.ok) return;
      const data = await res.json();
      setPayments(data);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchUsers();
      await fetchLoans();
      await fetchPayments();
      await fetchLedgers();
    };
    fetchData();
  }, []);

  // Fetch cycles when loan selection changes
  useEffect(() => {
    if (formData.loanId) {
      fetchCycles(formData.loanId);
    } else {
      setCycles([]);
      setFormData((prev) => ({ ...prev, cycleId: "" }));
    }
  }, [formData.loanId]);

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
        loanId: formData.loanId || undefined,
        cycleId: formData.cycleId || undefined,
        paymentId: formData.paymentId || undefined,
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

  const handleEdit = (ledger: Ledger) => {
    setFormData({
      _id: ledger._id,
      date: new Date(ledger.date).toISOString().split("T")[0],
      userId: ledger.userId?._id || "",
      type: ledger.type,
      direction: ledger.direction,
      amount: ledger.amount,
      loanId: ledger.loanId?._id || "",
      cycleId: ledger.cycleId?._id || "",
      paymentId: ledger.paymentId?._id || "",
      description: ledger.description || "",
      status: ledger.status,
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
      const res = await fetch(`/api/admin/ledger/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        toast.success("Ledger entry cancelled successfully! 🗑️");
        fetchLedgers();
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
      loanId: "",
      cycleId: "",
      paymentId: "",
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

  const getClientFullName = (client: Client) => {
    const parts = [client.firstName];
    if (client.middleName) parts.push(client.middleName);
    parts.push(client.lastName);
    return parts.join(" ");
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
              title="Add New Ledger Entry"
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
              <span className="hidden sm:inline">Add New Entry</span>
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
              <div className="flex items-center justify-end gap-2">
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
                {canEdit && ledger.status === "Completed" && (
                  <button
                    onClick={() => handleEdit(ledger)}
                    className="text-yellow-600 hover:text-yellow-800 transition-colors"
                    title="Edit Ledger Entry"
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
                  </button>
                )}
                {canDelete && ledger.status === "Completed" && (
                  <button
                    onClick={() =>
                      handleDeleteClick(
                        ledger._id,
                        `${ledger.type} - ${ledger.amount}`,
                      )
                    }
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Cancel Ledger Entry"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
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
        title={isEditing ? "Edit Ledger Entry" : "Add New Ledger Entry"}
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
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
                required
              >
                {ledgerTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Direction <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.direction}
                onChange={(e) =>
                  setFormData({ ...formData, direction: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
                required
              >
                {ledgerDirections.map((direction) => (
                  <option key={direction} value={direction}>
                    {direction}
                  </option>
                ))}
              </select>
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
                User
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan
              </label>
              <select
                value={formData.loanId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    loanId: e.target.value,
                    cycleId: "",
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              >
                <option value="">Select Loan (Optional)</option>
                {loans.map((loan) => (
                  <option key={loan._id} value={loan._id}>
                    {loan.loanNo} - {getClientFullName(loan.clientId)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cycle
              </label>
              <select
                value={formData.cycleId}
                onChange={(e) =>
                  setFormData({ ...formData, cycleId: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
                disabled={!formData.loanId}
              >
                <option value="">Select Cycle (Optional)</option>
                {cycles.map((cycle) => (
                  <option key={cycle._id} value={cycle._id}>
                    Cycle #{cycle.cycleCount} - Due: {formatDate(cycle.dateDue)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment
              </label>
              <select
                value={formData.paymentId}
                onChange={(e) =>
                  setFormData({ ...formData, paymentId: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              >
                <option value="">Select Payment (Optional)</option>
                {payments.map((payment) => (
                  <option key={payment._id} value={payment._id}>
                    {payment.paymentNo} -{" "}
                    {payment.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </option>
                ))}
              </select>
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
                required
              >
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
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

          <div className="flex justify-end gap-3 pt-4 border-t">
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Cancel Ledger Entry"
        message={`Are you sure you want to cancel this ledger entry "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Cancel Entry"
        cancelText="Close"
        requireReason={true}
        isLoading={loading}
      />

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

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageAccess } from "@/hooks/usePageAccess";
import { useAuth } from "@/context/AuthContext";
import PageNotFound from "@/components/PageNotFound";
import LoadingModal from "@/components/LoadingModal";
import ErrorModal from "@/components/ErrorModal";
import ConfirmModal from "@/components/ConfirmModal";
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
  deletedAt?: string;
  deletedBy?: User;
  deletedReason?: string;
}

export default function LedgerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ledgerId = params.id as string;
  const { loading: pageLoading, accessDenied } = usePageAccess();
  const { hasPermission, user: currentUser } = useAuth();
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [formData, setFormData] = useState({
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
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: "",
  });

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

  // Helper function to format date to YYYY-MM-DD
  const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/ledger/${ledgerId}`);
      if (res.ok) {
        const data = await res.json();
        setLedger(data);
        setFormData({
          date: new Date(data.date).toISOString().split("T")[0],
          userId: data.userId?._id || "",
          type: data.type,
          direction: data.direction,
          amount: data.amount,
          loanId: data.loanId?._id || "",
          cycleId: data.cycleId?._id || "",
          paymentId: data.paymentId?._id || "",
          description: data.description || "",
          status: data.status,
        });
      } else {
        router.push("/admin/ledger");
      }
    } catch (error) {
      console.error("Error fetching ledger:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to fetch ledger details. Please try again.",
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
      await fetchLedger();
    };
    fetchData();
  }, [ledgerId]);

  // Fetch cycles when loan selection changes in edit mode
  useEffect(() => {
    if (formData.loanId && isEditing) {
      fetchCycles(formData.loanId);
    }
  }, [formData.loanId, isEditing]);

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

  if (!ledger) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowLoadingModal(true);

    try {
      const res = await fetch(`/api/admin/ledger/${ledgerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: formData.userId || undefined,
          loanId: formData.loanId || undefined,
          cycleId: formData.cycleId || undefined,
          paymentId: formData.paymentId || undefined,
          updatedBy: currentUser?._id,
        }),
      });

      if (res.ok) {
        toast.success("Ledger entry updated successfully! ✅");
        setIsEditing(false);
        await fetchLedger();
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

  const handleDelete = async (reason?: string) => {
    if (!reason) return;

    setShowDeleteModal(false);
    setShowLoadingModal(true);

    try {
      const res = await fetch(`/api/admin/ledger/${ledgerId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        toast.success("Ledger entry cancelled successfully! 🗑️");
        router.push("/admin/ledger");
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

  const getUserFullName = (user: User) => {
    return `${user.firstName} ${user.lastName}`;
  };

  const getClientFullName = (client: Client) => {
    const parts = [client.firstName];
    if (client.middleName) parts.push(client.middleName);
    parts.push(client.lastName);
    return parts.join(" ");
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDirectionBadgeClass = (direction: string) => {
    switch (direction) {
      case "In":
        return "bg-blue-100 text-blue-800";
      case "Out":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-10 md:mt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-10 md:mt-0">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.push("/admin/ledger")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Ledger"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-800">
              Ledger Entry Details
            </h1>
            <span
              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(ledger.status)}`}
            >
              {ledger.status}
            </span>
          </div>
          <p className="text-gray-600">{ledger.type}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
        {!isEditing && canEdit && ledger.status === "Completed" && (
          <button
            onClick={() => {
              setIsEditing(true);
              if (ledger.loanId) {
                fetchCycles(ledger.loanId._id);
              }
            }}
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
            <span>Edit Entry</span>
          </button>
        )}

        {!isEditing && canDelete && ledger.status === "Completed" && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Cancel Entry</span>
          </button>
        )}

        {isEditing && (
          <button
            onClick={() => {
              setIsEditing(false);
              setFormData({
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
            }}
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
          {/* Ledger Information Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-zentyal-primary">
              Ledger Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                    {formatDate(ledger.date)}
                  </div>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                  >
                    {ledgerTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                    {ledger.type}
                  </div>
                )}
              </div>

              {/* Direction */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Direction <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <select
                    value={formData.direction}
                    onChange={(e) =>
                      setFormData({ ...formData, direction: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                  >
                    {ledgerDirections.map((direction) => (
                      <option key={direction} value={direction}>
                        {direction}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getDirectionBadgeClass(ledger.direction)}`}
                    >
                      {ledger.direction}
                    </span>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
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
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg">
                    <span
                      className={`text-gray-900 font-mono font-semibold ${
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
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(ledger.status)}`}
                    >
                      {ledger.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                {isEditing ? (
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
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 min-h-20">
                    {ledger.description || "No description"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Related Information Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-zentyal-primary">
              Related Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User
                </label>
                {isEditing ? (
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
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                    {ledger.userId ? getUserFullName(ledger.userId) : "N/A"}
                  </div>
                )}
              </div>

              {/* Loan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan
                </label>
                {isEditing ? (
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
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                    {ledger.loanId
                      ? `${ledger.loanId.loanNo} - ${getClientFullName(ledger.loanId.clientId)}`
                      : "N/A"}
                  </div>
                )}
              </div>

              {/* Cycle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cycle
                </label>
                {isEditing ? (
                  <select
                    value={formData.cycleId}
                    onChange={(e) =>
                      setFormData({ ...formData, cycleId: e.target.value })
                    }
                    disabled={!formData.loanId}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all
                             disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Cycle (Optional)</option>
                    {cycles.map((cycle) => (
                      <option key={cycle._id} value={cycle._id}>
                        Cycle #{cycle.cycleCount} - Due:{" "}
                        {formatDate(cycle.dateDue)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                    {ledger.cycleId
                      ? `Cycle #${ledger.cycleId.cycleCount}`
                      : "N/A"}
                  </div>
                )}
              </div>

              {/* Payment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment
                </label>
                {isEditing ? (
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
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                    {ledger.paymentId ? ledger.paymentId.paymentNo : "N/A"}
                  </div>
                )}
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
                  {new Date(ledger.createdAt).toLocaleString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created By
                </label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                  {ledger.createdBy
                    ? getUserFullName(ledger.createdBy)
                    : "System"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Updated
                </label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                  {new Date(ledger.updatedAt).toLocaleString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Updated By
                </label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                  {ledger.updatedBy
                    ? getUserFullName(ledger.updatedBy)
                    : "System"}
                </div>
              </div>

              {ledger.deletedAt && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cancelled At
                    </label>
                    <div className="px-4 py-2.5 bg-red-50 rounded-lg text-red-900">
                      {new Date(ledger.deletedAt).toLocaleString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cancelled By
                    </label>
                    <div className="px-4 py-2.5 bg-red-50 rounded-lg text-red-900">
                      {ledger.deletedBy
                        ? getUserFullName(ledger.deletedBy)
                        : "System"}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cancellation Reason
                    </label>
                    <div className="px-4 py-2.5 bg-red-50 rounded-lg text-red-900 min-h-15">
                      {ledger.deletedReason || "No reason specified"}
                    </div>
                  </div>
                </>
              )}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Cancel Ledger Entry"
        message="Are you sure you want to cancel this ledger entry? This action cannot be undone."
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

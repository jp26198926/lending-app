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

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Payment {
  _id: string;
  paymentNo: string;
  loanId: Loan;
  cycleId: Cycle;
  amount: number;
  datePaid: string;
  remarks?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
  updatedBy?: User;
  deletedAt?: string;
  deletedBy?: User;
  deletedReason?: string;
}

export default function PaymentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const paymentId = params.id as string;
  const { loading: pageLoading, accessDenied } = usePageAccess();
  const { hasPermission, user: currentUser } = useAuth();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [formData, setFormData] = useState({
    loanId: "",
    cycleId: "",
    amount: 0,
    datePaid: new Date().toISOString().split("T")[0],
    remarks: "",
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

  const canEdit = hasPermission("/admin/payment", "Edit");
  const canDelete = hasPermission("/admin/payment", "Delete");

  const fetchPayment = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/payment/${paymentId}`);
      if (res.ok) {
        const data = await res.json();
        setPayment(data);
        setFormData({
          loanId: data.loanId._id,
          cycleId: data.cycleId._id,
          amount: data.amount,
          datePaid: new Date(data.datePaid).toISOString().split("T")[0],
          remarks: data.remarks || "",
          status: data.status,
        });
      } else {
        router.push("/admin/payment");
      }
    } catch (error) {
      console.error("Error fetching payment:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to fetch payment details. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLoans = async () => {
    try {
      const res = await fetch("/api/admin/loan");
      if (!res.ok) return;
      const data = await res.json();
      const activeLoans = data.filter((l: Loan) => l.status === "Active");
      setLoans(activeLoans);
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
      const activeCycles = data.filter((c: Cycle) => c.status === "Active");
      setCycles(activeCycles);
    } catch (error) {
      console.error("Error fetching cycles:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchLoans();
      await fetchPayment();
    };
    fetchData();
  }, [paymentId]);

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

  if (!payment) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowLoadingModal(true);

    try {
      const res = await fetch(`/api/admin/payment/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          updatedBy: currentUser?._id,
        }),
      });

      if (res.ok) {
        toast.success("Payment updated successfully! ✅");
        setIsEditing(false);
        await fetchPayment();
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
      const res = await fetch(
        `/api/admin/payment/${paymentId}?deletedBy=${currentUser?._id}&deletedReason=${encodeURIComponent(reason)}`,
        { method: "DELETE" },
      );

      if (res.ok) {
        toast.success("Payment cancelled successfully! 🗑️");
        router.push("/admin/payment");
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

  return (
    <div className="max-w-7xl mx-auto mt-10 md:mt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-10 md:mt-0">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.push("/admin/payment")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Payments"
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
              {payment.paymentNo}
            </h1>
            <span
              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(payment.status)}`}
            >
              {payment.status}
            </span>
          </div>
          <p className="text-gray-600">
            {payment.loanId.loanNo} -{" "}
            {getClientFullName(payment.loanId.clientId)}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
        {!isEditing && canEdit && payment.status === "Completed" && (
          <button
            onClick={() => {
              setIsEditing(true);
              fetchCycles(payment.loanId._id);
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
            <span>Edit Payment</span>
          </button>
        )}

        {!isEditing && canDelete && payment.status === "Completed" && (
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
            <span>Cancel Payment</span>
          </button>
        )}

        {isEditing && (
          <button
            onClick={() => {
              setIsEditing(false);
              setFormData({
                loanId: payment.loanId._id,
                cycleId: payment.cycleId._id,
                amount: payment.amount,
                datePaid: new Date(payment.datePaid)
                  .toISOString()
                  .split("T")[0],
                remarks: payment.remarks || "",
                status: payment.status,
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
          {/* Payment Information Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-zentyal-primary">
              Payment Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Number - Always Read-only (Auto-generated) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment No.
                </label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-semibold">
                  {payment.paymentNo}
                </div>
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
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-mono font-semibold">
                    {payment.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                )}
              </div>

              {/* Date Paid */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Paid <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.datePaid}
                    onChange={(e) =>
                      setFormData({ ...formData, datePaid: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                    {new Date(payment.datePaid).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
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
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(payment.status)}`}
                    >
                      {payment.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.remarks}
                    onChange={(e) =>
                      setFormData({ ...formData, remarks: e.target.value })
                    }
                    rows={3}
                    placeholder="Add any notes or remarks about this payment..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all resize-none"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 min-h-[80px]">
                    {payment.remarks || "No remarks"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Loan Information Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-zentyal-primary">
              Loan Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Loan */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan <span className="text-red-500">*</span>
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
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                  >
                    <option value="">Select a loan</option>
                    {loans.map((loan) => (
                      <option key={loan._id} value={loan._id}>
                        {loan.loanNo} - {getClientFullName(loan.clientId)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                    {payment.loanId.loanNo} -{" "}
                    {getClientFullName(payment.loanId.clientId)}
                  </div>
                )}
              </div>

              {/* Cycle */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cycle <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <select
                    value={formData.cycleId}
                    onChange={(e) =>
                      setFormData({ ...formData, cycleId: e.target.value })
                    }
                    required
                    disabled={!formData.loanId}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all
                             disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select a cycle</option>
                    {cycles.map((cycle) => (
                      <option key={cycle._id} value={cycle._id}>
                        Cycle #{cycle.cycleCount} - Due:{" "}
                        {new Date(cycle.dateDue).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                    Cycle #{payment.cycleId.cycleCount} - Due:{" "}
                    {new Date(payment.cycleId.dateDue).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Client Info (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client
                </label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                  {getClientFullName(payment.loanId.clientId)}
                </div>
              </div>

              {/* Client Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Email
                </label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                  {payment.loanId.clientId.email}
                </div>
              </div>
            </div>
          </div>

          {/* Cycle Details Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-zentyal-primary">
              Cycle Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Due
                </label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-mono">
                  {payment.cycleId.totalDue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Paid
                </label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-mono">
                  {payment.cycleId.totalPaid.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Balance
                </label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-mono font-semibold">
                  {payment.cycleId.balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
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
                  Created By
                </label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                  {payment.createdBy
                    ? `${payment.createdBy.firstName} ${payment.createdBy.lastName}`
                    : "N/A"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created At
                </label>
                <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                  {new Date(payment.createdAt).toLocaleString()}
                </div>
              </div>

              {payment.updatedBy && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Updated By
                    </label>
                    <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                      {`${payment.updatedBy.firstName} ${payment.updatedBy.lastName}`}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Updated At
                    </label>
                    <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                      {new Date(payment.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </>
              )}

              {payment.deletedBy && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cancelled By
                    </label>
                    <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                      {`${payment.deletedBy.firstName} ${payment.deletedBy.lastName}`}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cancelled At
                    </label>
                    <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                      {payment.deletedAt
                        ? new Date(payment.deletedAt).toLocaleString()
                        : "N/A"}
                    </div>
                  </div>

                  {payment.deletedReason && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cancellation Reason
                      </label>
                      <div className="px-4 py-2.5 bg-red-50 rounded-lg text-gray-900 border border-red-200">
                        {payment.deletedReason}
                      </div>
                    </div>
                  )}
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
                className="px-8 py-3 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark 
                         transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                         flex items-center gap-2 font-medium"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Save Changes</span>
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
        title="Cancel Payment"
        message={`Are you sure you want to cancel payment "${payment.paymentNo}"? This action cannot be undone.`}
        confirmText="Cancel Payment"
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
        message={errorModal.message}
        onClose={() => setErrorModal({ isOpen: false, message: "" })}
      />
    </div>
  );
}

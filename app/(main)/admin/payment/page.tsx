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
}

export default function PaymentPage() {
  const router = useRouter();
  const { loading: pageLoading, accessDenied } = usePageAccess();
  const { hasPermission, user: currentUser } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string>("");
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [formData, setFormData] = useState({
    _id: "",
    loanId: "",
    cycleId: "",
    amount: 0,
    datePaid: new Date().toISOString().split("T")[0],
    remarks: "",
    status: "Completed",
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
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: "",
  });

  const canAdd = hasPermission("/admin/payment", "Add");
  const canEdit = hasPermission("/admin/payment", "Edit");
  const canDelete = hasPermission("/admin/payment", "Delete");

  const fetchPayments = async (loanId?: string, cycleId?: string) => {
    try {
      setLoading(true);
      let url = "/api/admin/payment";
      const params = new URLSearchParams();
      if (loanId) params.append("loanId", loanId);
      if (cycleId) params.append("cycleId", cycleId);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      setPayments(data);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to fetch payments. Please try again.",
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
      await fetchPayments();
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

  // Fetch payments when filters change
  useEffect(() => {
    fetchPayments(selectedLoanId || undefined, selectedCycleId || undefined);
  }, [selectedLoanId, selectedCycleId]);

  // Fetch cycles for filter when loan filter changes
  useEffect(() => {
    if (selectedLoanId) {
      fetchCycles(selectedLoanId);
    } else {
      setCycles([]);
      setSelectedCycleId("");
    }
  }, [selectedLoanId]);

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
        ? `/api/admin/payment/${formData._id}`
        : "/api/admin/payment";
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
            ? "Payment updated successfully! ✅"
            : "Payment created successfully! 🎉",
        );
        resetForm();
        fetchPayments(
          selectedLoanId || undefined,
          selectedCycleId || undefined,
        );
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

  const handleEdit = (payment: Payment) => {
    setFormData({
      _id: payment._id,
      loanId: payment.loanId._id,
      cycleId: payment.cycleId._id,
      amount: payment.amount,
      datePaid: new Date(payment.datePaid).toISOString().split("T")[0],
      remarks: payment.remarks || "",
      status: payment.status,
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
        `/api/admin/payment/${deleteTarget.id}?deletedBy=${currentUser?._id}&deletedReason=${encodeURIComponent(reason)}`,
        { method: "DELETE" },
      );

      if (res.ok) {
        toast.success("Payment cancelled successfully! 🗑️");
        fetchPayments(
          selectedLoanId || undefined,
          selectedCycleId || undefined,
        );
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
      loanId: "",
      cycleId: "",
      amount: 0,
      datePaid: new Date().toISOString().split("T")[0],
      remarks: "",
      status: "Completed",
    });
    setIsEditing(false);
  };

  const getClientFullName = (client: Client) => {
    const parts = [client.firstName];
    if (client.middleName) parts.push(client.middleName);
    parts.push(client.lastName);
    return parts.join(" ");
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 mt-10 md:mt-0">
              Payment Management
            </h1>
            <p className="text-gray-600">Track and manage loan payments</p>
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
              title="Add New Payment"
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
              <span className="hidden sm:inline">Add New Payment</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Loan
              </label>
              <select
                value={selectedLoanId}
                onChange={(e) => setSelectedLoanId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              >
                <option value="">All Loans</option>
                {loans.map((loan) => (
                  <option key={loan._id} value={loan._id}>
                    {loan.loanNo} - {getClientFullName(loan.clientId)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Cycle
              </label>
              <select
                value={selectedCycleId}
                onChange={(e) => setSelectedCycleId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
                disabled={!selectedLoanId}
              >
                <option value="">All Cycles</option>
                {cycles.map((cycle) => (
                  <option key={cycle._id} value={cycle._id}>
                    Cycle #{cycle.cycleCount} - Due:{" "}
                    {new Date(cycle.dateDue).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(selectedLoanId || selectedCycleId) && (
            <button
              onClick={() => {
                setSelectedLoanId("");
                setSelectedCycleId("");
              }}
              className="mt-3 px-4 py-2 text-sm text-zentyal-primary hover:text-zentyal-dark 
                       hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
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
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Payments Table with DataTable Component */}
      <DataTable
        data={payments}
        columns={[
          {
            key: "paymentNo",
            label: "Payment No.",
            sortable: true,
            searchable: true,
            render: (payment: Payment) => (
              <span className="text-sm font-semibold text-zentyal-primary">
                {payment.paymentNo}
              </span>
            ),
          },
          {
            key: "loanNo",
            label: "Loan No.",
            sortable: true,
            searchable: true,
            render: (payment: Payment) => (
              <span className="text-sm text-gray-900">
                {payment.loanId.loanNo}
              </span>
            ),
            exportValue: (payment: Payment) => payment.loanId.loanNo,
          },
          {
            key: "clientName",
            label: "Client",
            sortable: true,
            searchable: true,
            render: (payment: Payment) => (
              <span className="text-sm text-gray-900">
                {getClientFullName(payment.loanId.clientId)}
              </span>
            ),
            exportValue: (payment: Payment) =>
              getClientFullName(payment.loanId.clientId),
          },
          {
            key: "cycleCount",
            label: "Cycle",
            sortable: true,
            render: (payment: Payment) => (
              <span className="text-sm font-bold text-gray-900">
                #{payment.cycleId.cycleCount}
              </span>
            ),
            exportValue: (payment: Payment) => `#${payment.cycleId.cycleCount}`,
          },
          {
            key: "amount",
            label: "Amount",
            sortable: true,
            render: (payment: Payment) => (
              <div className="text-right">
                <span className="text-sm text-gray-900 font-mono">
                  {payment.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            ),
            exportValue: (payment: Payment) => payment.amount.toFixed(2),
          },
          {
            key: "datePaid",
            label: "Date Paid",
            sortable: true,
            render: (payment: Payment) => (
              <span className="text-sm text-gray-700">
                {new Date(payment.datePaid).toLocaleDateString()}
              </span>
            ),
            exportValue: (payment: Payment) =>
              new Date(payment.datePaid).toLocaleDateString(),
          },
          {
            key: "status",
            label: "Status",
            sortable: true,
            searchable: true,
            render: (payment: Payment) => getStatusBadge(payment.status),
          },
          {
            key: "actions",
            label: "Actions",
            sortable: false,
            searchable: false,
            render: (payment: Payment) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => router.push(`/admin/payment/${payment._id}`)}
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
                {canEdit && payment.status === "Completed" && (
                  <button
                    onClick={() => handleEdit(payment)}
                    className="text-yellow-600 hover:text-yellow-800 transition-colors"
                    title="Edit Payment"
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
                {canDelete && payment.status === "Completed" && (
                  <button
                    onClick={() =>
                      handleDeleteClick(payment._id, payment.paymentNo)
                    }
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Cancel Payment"
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
        emptyMessage="No payments found"
        exportFileName="payments-export"
        searchPlaceholder="Search payments..."
        onRowClick={(payment) => router.push(`/admin/payment/${payment._id}`)}
      />

      {/* Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={handleCloseFormModal}
        title={isEditing ? "Edit Payment" : "Add New Payment"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan <span className="text-red-500">*</span>
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
                required
              >
                <option value="">Select Loan</option>
                {loans.map((loan) => (
                  <option key={loan._id} value={loan._id}>
                    {loan.loanNo} - {getClientFullName(loan.clientId)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cycle <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.cycleId}
                onChange={(e) =>
                  setFormData({ ...formData, cycleId: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
                required
                disabled={!formData.loanId}
              >
                <option value="">Select Cycle</option>
                {cycles.map((cycle) => (
                  <option key={cycle._id} value={cycle._id}>
                    Cycle #{cycle.cycleCount} - Due:{" "}
                    {new Date(cycle.dateDue).toLocaleDateString()}
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
                Date Paid <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.datePaid}
                onChange={(e) =>
                  setFormData({ ...formData, datePaid: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
                required
              />
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
                Remarks
              </label>
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
              {isEditing ? "Update Payment" : "Create Payment"}
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
        title="Cancel Payment"
        message={`Are you sure you want to cancel payment "${deleteTarget?.name}"? This action cannot be undone.`}
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

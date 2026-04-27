"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageAccess } from "@/hooks/usePageAccess";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import PageNotFound from "@/components/PageNotFound";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import LoadingModal from "@/components/LoadingModal";
import ErrorModal from "@/components/ErrorModal";
import { StatusBadge } from "@/components/CRUDComponents";
import DataTable, { Column } from "@/components/DataTable";
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
  dateStarted: string;
  status: string;
}

interface Cycle {
  _id: string;
  loanId: Loan;
  cycleCount: number;
  principal: number;
  interestRate: number;
  interestAmount: number;
  totalDue: number;
  totalPaid: number;
  balance: number;
  profitExpected: number;
  profitEarned: number;
  profitRemaining: number;
  dateDue: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  _id: string;
  cycleId: {
    _id: string;
    cycleCount: number;
  };
  amount: number;
  datePaid: string;
  status: string;
  createdAt: string;
}

export default function LoanCyclesPage() {
  const router = useRouter();
  const params = useParams();
  const loanId = params.id as string;

  const { loading: pageLoading, accessDenied } = usePageAccess();
  const { hasPermission, user: currentUser } = useAuth();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(null);
  const [addFormData, setAddFormData] = useState({
    cycleCount: 1,
    principal: 0,
    interestRate: 0,
    interestAmount: 0,
    totalDue: 0,
    dateDue: new Date().toISOString().split("T")[0],
    status: "Active",
  });
  const [formData, setFormData] = useState({
    _id: "",
    cycleCount: 1,
    principal: 0,
    interestRate: 0,
    interestAmount: 0,
    totalDue: 0,
    dateDue: new Date().toISOString().split("T")[0],
    status: "Active",
  });
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedCycleForPayment, setSelectedCycleForPayment] =
    useState<Cycle | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    status: "Completed",
  });
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showAddPaymentForm, setShowAddPaymentForm] = useState(false);
  const [paymentAmountError, setPaymentAmountError] = useState("");

  const canAdd = hasPermission("/admin/cycle", "Add");
  const canEdit = hasPermission("/admin/cycle", "Edit");
  const canDelete = hasPermission("/admin/cycle", "Delete");

  const fetchLoan = async () => {
    try {
      const res = await fetch(`/api/admin/loan/${loanId}`);
      if (res.ok) {
        const data = await res.json();
        setLoan(data);
      }
    } catch (error) {
      console.error("Error fetching loan:", error);
    }
  };

  const fetchCycles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/cycle?loanId=${loanId}`);
      const data = await res.json();
      setCycles(data);
    } catch (error) {
      console.error("Error fetching cycles:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to fetch cycles. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getClientFullName = (client: Client) => {
    const parts = [client.firstName];
    if (client.middleName) parts.push(client.middleName);
    parts.push(client.lastName);
    return parts.join(" ");
  };

  const handleAddCycle = () => {
    // Check if there's already an active cycle
    const activeCycle = cycles.find((c) => c.status === "Active");
    if (activeCycle) {
      setErrorModal({
        isOpen: true,
        message: `Cannot add a new cycle. There is already an active cycle (Cycle #${activeCycle.cycleCount}). Please complete or cancel the existing active cycle before adding a new one.`,
      });
      return;
    }

    // Calculate next cycle count
    const maxCycleCount =
      cycles.length > 0 ? Math.max(...cycles.map((c) => c.cycleCount)) : 0;

    // Check for previous expired cycle with balance
    const expiredCycles = cycles.filter((c) => c.status === "Expired");
    const mostRecentExpiredCycle =
      expiredCycles.length > 0
        ? expiredCycles.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )[0]
        : null;

    // Get principal and interest rate
    let principal = loan?.principal || 0;
    const interestRate = loan?.interestRate || 0;

    // If there's an expired cycle with balance, use that balance as new principal
    if (mostRecentExpiredCycle && mostRecentExpiredCycle.balance > 0) {
      principal = mostRecentExpiredCycle.balance;
    }

    // Auto-calculate interest amount and total due based on (potentially new) principal
    const interestAmount = (principal * interestRate) / 100;
    const totalDue = principal + interestAmount;

    // Calculate default due date based on loan terms
    let defaultDueDate = new Date().toISOString().split("T")[0];

    if (loan) {
      // Get term days
      let termDays = 30; // default to monthly
      if (loan.terms === "Weekly") termDays = 7;
      else if (loan.terms === "Fortnightly") termDays = 14;
      else if (loan.terms === "Monthly") termDays = 30;

      // Determine start date
      let startDate: Date;
      if (cycles.length === 0) {
        // No previous cycle: use loan's dateStarted
        startDate = new Date(loan.dateStarted);
      } else {
        // Has previous cycles: use the most recent cycle's dateDue
        const sortedCycles = [...cycles].sort(
          (a, b) =>
            new Date(b.dateDue).getTime() - new Date(a.dateDue).getTime(),
        );
        startDate = new Date(sortedCycles[0].dateDue);
      }

      // Add term days to get default due date
      startDate.setDate(startDate.getDate() + termDays);
      defaultDueDate = startDate.toISOString().split("T")[0];
    }

    // Reset form with default values
    setAddFormData({
      cycleCount: maxCycleCount + 1,
      principal,
      interestRate,
      interestAmount,
      totalDue,
      dateDue: defaultDueDate,
      status: "Active",
    });
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowLoadingModal(true);

    try {
      const res = await fetch("/api/admin/cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addFormData,
          loanId,
          createdBy: currentUser?._id,
        }),
      });

      if (res.ok) {
        toast.success("Cycle created successfully! ✅");
        setShowAddModal(false);
        fetchCycles();
      } else {
        const error = await res.json();
        setShowAddModal(false);
        setErrorModal({
          isOpen: true,
          message: error.error || "Failed to create cycle. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setShowAddModal(false);
      setErrorModal({
        isOpen: true,
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setShowLoadingModal(false);
    }
  };

  const handleViewDetails = (cycle: Cycle) => {
    setSelectedCycle(cycle);
    setShowViewModal(true);
  };

  const handleEdit = (cycle: Cycle) => {
    setSelectedCycle(cycle);
    setFormData({
      _id: cycle._id,
      cycleCount: cycle.cycleCount,
      principal: cycle.principal,
      interestRate: cycle.interestRate,
      interestAmount: cycle.interestAmount,
      totalDue: cycle.totalDue,
      dateDue: new Date(cycle.dateDue).toISOString().split("T")[0],
      status: cycle.status,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowLoadingModal(true);

    try {
      const res = await fetch(`/api/admin/cycle/${formData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          loanId,
          updatedBy: currentUser?._id,
        }),
      });

      if (res.ok) {
        toast.success("Cycle updated successfully! ✅");
        setShowEditModal(false);
        fetchCycles();
      } else {
        const error = await res.json();
        setShowEditModal(false);
        setErrorModal({
          isOpen: true,
          message: error.error || "Update failed. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setShowEditModal(false);
      setErrorModal({
        isOpen: true,
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setShowLoadingModal(false);
    }
  };

  const handleDeleteClick = async (id: string, name: string) => {
    // Check if there are completed payments for this cycle
    try {
      const res = await fetch(
        `/api/admin/payment?cycleId=${id}&status=Completed`,
      );
      if (res.ok) {
        const payments = await res.json();
        if (payments.length > 0) {
          setErrorModal({
            isOpen: true,
            message: `Cannot delete this cycle. There ${payments.length === 1 ? "is 1 completed payment" : `are ${payments.length} completed payments`} associated with this cycle. Please cancel the payment(s) first in the Payment Management page before deleting this cycle.`,
          });
          return;
        }
      }
    } catch (error) {
      console.error("Error checking payments:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to verify cycle payments. Please try again.",
      });
      return;
    }

    // If no completed payments, proceed with delete
    setDeleteTarget({ id, name });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (reason?: string) => {
    if (!deleteTarget || !reason) return;

    setShowDeleteModal(false);
    setShowLoadingModal(true);

    try {
      const res = await fetch(`/api/admin/cycle/${deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        toast.success("Cycle cancelled successfully! 🗑️");
        fetchCycles();
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
    // Frontend validation: Check if there's already an active cycle for this loan
    const cycleToActivate = cycles.find((c) => c._id === id);
    if (cycleToActivate) {
      const hasActiveCycle = cycles.some(
        (c) =>
          c.loanId._id === cycleToActivate.loanId._id &&
          c.status === "Active" &&
          c._id !== id,
      );

      if (hasActiveCycle) {
        setErrorModal({
          isOpen: true,
          message:
            "Cannot activate this cycle. An active cycle already exists for this loan. Please cancel or complete the existing active cycle first.",
        });
        return;
      }
    }

    setActivateTarget({ id, name });
    setShowActivateModal(true);
  };

  const handleActivateConfirm = async (reason?: string) => {
    if (!activateTarget) return;

    setShowActivateModal(false);
    setShowLoadingModal(true);

    try {
      const res = await fetch(`/api/admin/cycle/${activateTarget.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "Active",
          activationReason: reason || "Reactivated",
        }),
      });

      if (res.ok) {
        toast.success("Cycle activated successfully! ✅");
        fetchCycles();
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

  const handlePaymentClick = async (cycle: Cycle) => {
    setSelectedCycleForPayment(cycle);
    setPaymentFormData({
      amount: 0,
      paymentDate: new Date().toISOString().split("T")[0],
      status: "Completed",
    });
    setShowAddPaymentForm(false); // Hide form by default
    setPaymentAmountError(""); // Reset error
    setShowPaymentModal(true);
    // Fetch payments for this cycle
    await fetchPayments(cycle._id);
  };

  const fetchPayments = async (cycleId: string) => {
    try {
      const res = await fetch(`/api/admin/payment?cycleId=${cycleId}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycleForPayment) return;

    // Validate amount doesn't exceed balance
    if (paymentFormData.amount > selectedCycleForPayment.balance) {
      setPaymentAmountError(
        `Payment amount cannot exceed the balance of ${selectedCycleForPayment.balance.toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        )}`,
      );
      return;
    }

    setShowLoadingModal(true);

    try {
      const res = await fetch("/api/admin/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanId: selectedCycleForPayment.loanId._id,
          cycleId: selectedCycleForPayment._id,
          amount: paymentFormData.amount,
          datePaid: paymentFormData.paymentDate,
          status: paymentFormData.status,
          createdBy: currentUser?._id,
        }),
      });

      if (res.ok) {
        toast.success("Payment added successfully! ✅");
        // Reset form
        setPaymentFormData({
          amount: 0,
          paymentDate: new Date().toISOString().split("T")[0],
          status: "Completed",
        });
        setPaymentAmountError("");
        setShowAddPaymentForm(false); // Hide form after successful add
        // Refresh payments and cycles
        await fetchPayments(selectedCycleForPayment._id);
        fetchCycles();
      } else {
        const error = await res.json();
        setShowPaymentModal(false);
        setErrorModal({
          isOpen: true,
          message: error.error || "Failed to add payment. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setShowPaymentModal(false);
      setErrorModal({
        isOpen: true,
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setShowLoadingModal(false);
    }
  };

  const handlePaymentAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    setPaymentFormData({
      ...paymentFormData,
      amount,
    });

    // Real-time validation
    if (selectedCycleForPayment && amount > selectedCycleForPayment.balance) {
      setPaymentAmountError(
        `Amount exceeds balance of ${selectedCycleForPayment.balance.toLocaleString(
          undefined,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        )}`,
      );
    } else {
      setPaymentAmountError("");
    }
  };

  const handleDeletePaymentClick = (id: string, name: string) => {
    setDeletePaymentTarget({ id, name });
    setShowDeletePaymentModal(true);
  };

  const handleDeletePaymentConfirm = async (reason?: string) => {
    if (!deletePaymentTarget || !selectedCycleForPayment) return;

    setShowDeletePaymentModal(false);
    setShowLoadingModal(true);

    try {
      const res = await fetch(`/api/admin/payment/${deletePaymentTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deletedReason: reason || "Deleted by user",
        }),
      });

      if (res.ok) {
        toast.success("Payment deleted successfully! ✅");
        await fetchPayments(selectedCycleForPayment._id);
        fetchCycles();
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
      setDeletePaymentTarget(null);
    }
  };

  useEffect(() => {
    if (loanId) {
      fetchLoan();
      fetchCycles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanId]);

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

  const cycleColumns: Column<Cycle>[] = [
    {
      key: "cycleCount",
      label: "Cycle",
      sortable: true,
      render: (cycle: Cycle) => (
        <span className="text-sm font-bold text-gray-900">
          #{cycle.cycleCount}
        </span>
      ),
      exportValue: (cycle: Cycle) => `#${cycle.cycleCount}`,
    },
    {
      key: "principal",
      label: "Principal",
      sortable: true,
      render: (cycle: Cycle) => (
        <div className="text-right">
          <span className="text-sm text-gray-900 font-mono">
            {cycle.principal.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      ),
      exportValue: (cycle: Cycle) =>
        `${cycle.principal.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
    {
      key: "interestRate",
      label: "Interest Rate",
      sortable: true,
      render: (cycle: Cycle) => (
        <span className="text-sm text-gray-900">
          {cycle.interestRate.toFixed(2)}%
        </span>
      ),
      exportValue: (cycle: Cycle) => `${cycle.interestRate.toFixed(2)}%`,
    },
    {
      key: "interestAmount",
      label: "Interest Amount",
      sortable: true,
      render: (cycle: Cycle) => (
        <div className="text-right">
          <span className="text-sm text-gray-900 font-mono">
            {cycle.interestAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      ),
      exportValue: (cycle: Cycle) =>
        `${cycle.interestAmount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
    {
      key: "totalDue",
      label: "Total Due",
      sortable: true,
      render: (cycle: Cycle) => (
        <div className="text-right">
          <span className="text-sm text-gray-900 font-mono">
            {cycle.totalDue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      ),
      exportValue: (cycle: Cycle) =>
        `${cycle.totalDue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
    {
      key: "totalPaid",
      label: "Total Paid",
      sortable: true,
      render: (cycle: Cycle) => (
        <div className="text-right">
          <span className="text-sm text-gray-900 font-mono">
            {cycle.totalPaid.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      ),
      exportValue: (cycle: Cycle) =>
        `${cycle.totalPaid.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
    {
      key: "balance",
      label: "Balance",
      sortable: true,
      render: (cycle: Cycle) => (
        <div className="text-right">
          <span className="text-sm font-bold text-red-600 font-mono">
            {cycle.balance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      ),
      exportValue: (cycle: Cycle) =>
        `${cycle.balance.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
    {
      key: "dateDue",
      label: "Due Date",
      sortable: true,
      render: (cycle: Cycle) => (
        <span className="text-sm text-gray-600">
          {new Date(cycle.dateDue).toISOString().split("T")[0]}
        </span>
      ),
      exportValue: (cycle: Cycle) =>
        new Date(cycle.dateDue).toISOString().split("T")[0],
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (cycle: Cycle) => (
        <div className="flex justify-end md:justify-center">
          <StatusBadge status={cycle.status} />
        </div>
      ),
      exportValue: (cycle: Cycle) => cycle.status,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      searchable: false,
      render: (cycle: Cycle) => {
        // Helper function: Check if there's a newer cycle after this one
        const hasNewerCycle = () => {
          return cycles.some((c) => c.cycleCount > cycle.cycleCount);
        };

        return (
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <button
              onClick={() => handleViewDetails(cycle)}
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
            <button
              onClick={() => handlePaymentClick(cycle)}
              className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Payments"
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
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </button>
            {/* Hide Edit button for Completed, Cancelled, and Expired cycles */}
            {cycle.status !== "Completed" &&
              canEdit &&
              cycle.status !== "Cancelled" &&
              cycle.status !== "Expired" && (
                <button
                  onClick={() => handleEdit(cycle)}
                  className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Edit Cycle"
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
            {cycle.status !== "Completed" &&
              canDelete &&
              cycle.status === "Active" && (
                <button
                  onClick={() =>
                    handleDeleteClick(
                      cycle._id,
                      `Cycle #${cycle.cycleCount} - ${cycle.loanId.loanNo}`,
                    )
                  }
                  className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Cancel Cycle"
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
            {/* Hide Activate button for:
                - Expired cycles (always)
                - Cancelled cycles if there's a newer cycle after it
            */}
            {cycle.status !== "Completed" &&
              canEdit &&
              cycle.status !== "Expired" &&
              cycle.status === "Cancelled" &&
              !hasNewerCycle() && (
                <button
                  onClick={() =>
                    handleActivateClick(
                      cycle._id,
                      `Cycle #${cycle.cycleCount} - ${cycle.loanId.loanNo}`,
                    )
                  }
                  className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Activate Cycle"
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
        );
      },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto mt-10 md:mt-0">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/admin/loan/${loanId}`)}
          className="flex items-center text-zentyal-primary hover:text-zentyal-dark mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Loan Details
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800">Loan Cycles</h1>
            {loan && (
              <div className="mt-2">
                <p className="text-gray-600">
                  <span className="font-semibold text-zentyal-primary">
                    {loan.loanNo}
                  </span>{" "}
                  - {getClientFullName(loan.clientId)}
                </p>
              </div>
            )}
          </div>

          {/* Add Cycle Button */}
          {canAdd && (
            <button
              onClick={handleAddCycle}
              className="w-full sm:w-auto px-4 py-2 bg-zentyal-primary text-white rounded-lg 
                       hover:bg-zentyal-dark transition-all duration-200 shadow-lg hover:shadow-xl 
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Add Cycle</span>
            </button>
          )}
        </div>
      </div>

      {/* Cycles DataTable */}
      <DataTable
        data={cycles}
        columns={cycleColumns}
        loading={loading}
        emptyMessage="No cycles found for this loan"
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        }
        exportFileName={`loan-${loan?.loanNo || "cycles"}-cycles`}
        searchPlaceholder="Search cycles..."
        itemsPerPage={10}
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

      {/* Add Cycle Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Cycle"
        size="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cycle Count
                <span className="text-xs text-gray-500 ml-1">
                  (Auto-generated)
                </span>
              </label>
              <input
                type="number"
                value={addFormData.cycleCount}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zentyal-primary bg-gray-50"
                disabled
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={addFormData.dateDue}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, dateDue: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zentyal-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Principal
                <span className="text-xs text-gray-500 ml-1">(From loan)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={addFormData.principal}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zentyal-primary bg-gray-50 font-mono"
                disabled
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Rate (%)
                <span className="text-xs text-gray-500 ml-1">(From loan)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={addFormData.interestRate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zentyal-primary bg-gray-50 font-mono"
                disabled
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Amount
                <span className="text-xs text-gray-500 ml-1">
                  (Auto-calculated)
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                value={addFormData.interestAmount}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zentyal-primary bg-gray-50 font-mono"
                disabled
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Due
                <span className="text-xs text-gray-500 ml-1">
                  (Auto-calculated)
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                value={addFormData.totalDue}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zentyal-primary bg-gray-50 font-mono"
                disabled
                required
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark transition-colors"
            >
              Create Cycle
            </button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Cycle Details"
        size="lg"
      >
        {selectedCycle && (
          <div className="space-y-6">
            {/* Loan Information */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Loan Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Loan No:</label>
                  <p className="text-sm font-semibold text-zentyal-primary">
                    {selectedCycle.loanId.loanNo}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Client:</label>
                  <p className="text-sm font-semibold">
                    {getClientFullName(selectedCycle.loanId.clientId)}
                  </p>
                </div>
              </div>
            </div>

            {/* Cycle Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Cycle Count:</label>
                <p className="text-lg font-bold text-gray-900">
                  #{selectedCycle.cycleCount}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Status:</label>
                <StatusBadge status={selectedCycle.status} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Principal:</label>
                <p className="text-lg font-semibold text-gray-900 font-mono">
                  {selectedCycle.principal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Interest Rate:</label>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedCycle.interestRate.toFixed(2)}%
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">
                  Interest Amount:
                </label>
                <p className="text-lg font-semibold text-gray-900 font-mono">
                  {selectedCycle.interestAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Total Due:</label>
                <p className="text-lg font-bold text-zentyal-primary font-mono">
                  {selectedCycle.totalDue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Total Paid:</label>
                <p className="text-lg font-semibold text-green-600 font-mono">
                  {selectedCycle.totalPaid.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Balance:</label>
                <p className="text-lg font-bold text-red-600 font-mono">
                  {selectedCycle.balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Due Date:</label>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(selectedCycle.dateDue).toISOString().split("T")[0]}
                </p>
              </div>
            </div>

            {/* Profit Information */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Profit Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-600">
                    Profit Expected:
                  </label>
                  <p className="text-lg font-semibold text-gray-900 font-mono">
                    {selectedCycle.profitExpected.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">
                    Profit Earned:
                  </label>
                  <p className="text-lg font-semibold text-green-600 font-mono">
                    {selectedCycle.profitEarned.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">
                    Profit Remaining:
                  </label>
                  <p className="text-lg font-semibold text-orange-600 font-mono">
                    {selectedCycle.profitRemaining.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Cycle Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Cycle"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cycle Count
                <span className="text-xs text-gray-500 ml-1">
                  (Auto-generated)
                </span>
              </label>
              <input
                type="number"
                value={formData.cycleCount}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zentyal-primary bg-gray-50"
                disabled
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dateDue}
                onChange={(e) =>
                  setFormData({ ...formData, dateDue: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zentyal-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Principal
                <span className="text-xs text-gray-500 ml-1">(From loan)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.principal}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zentyal-primary bg-gray-50 font-mono"
                disabled
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Rate (%)
                <span className="text-xs text-gray-500 ml-1">(From loan)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.interestRate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zentyal-primary bg-gray-50 font-mono"
                disabled
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Amount
                <span className="text-xs text-gray-500 ml-1">
                  (Auto-calculated)
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.interestAmount}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zentyal-primary bg-gray-50 font-mono"
                disabled
                required
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Due
                <span className="text-xs text-gray-500 ml-1">
                  (Auto-calculated)
                </span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.totalDue}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zentyal-primary bg-gray-50 font-mono"
                disabled
                required
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark transition-colors"
            >
              Update Cycle
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
        title="Cancel Cycle"
        message={`Are you sure you want to cancel "${deleteTarget?.name}"? This action will mark the cycle as cancelled.`}
        confirmText="Cancel Cycle"
        cancelText="Keep Cycle"
        requireReason={true}
        isLoading={false}
      />

      {/* Activate Confirmation Modal */}
      <ConfirmModal
        isOpen={showActivateModal}
        onClose={() => {
          setShowActivateModal(false);
          setActivateTarget(null);
        }}
        onConfirm={handleActivateConfirm}
        title="Activate Cycle"
        message={`Are you sure you want to activate "${activateTarget?.name}"?`}
        confirmText="Activate"
        cancelText="Cancel"
        requireReason={true}
        isLoading={false}
      />

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedCycleForPayment(null);
          setPayments([]);
          setShowAddPaymentForm(false);
          setPaymentAmountError("");
        }}
        title={
          selectedCycleForPayment
            ? `Payments - Cycle #${selectedCycleForPayment.cycleCount}`
            : "Payments"
        }
        size="xl"
      >
        <div className="space-y-6">
          {/* Balance Summary - Always visible */}
          {selectedCycleForPayment && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Due</p>
                  <p className="text-sm font-bold text-gray-900 font-mono">
                    {selectedCycleForPayment.totalDue.toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Paid</p>
                  <p className="text-sm font-bold text-green-600 font-mono">
                    {selectedCycleForPayment.totalPaid.toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Balance</p>
                  <p className="text-sm font-bold text-red-600 font-mono">
                    {selectedCycleForPayment.balance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                {showAddPaymentForm && paymentFormData.amount > 0 && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">
                      Balance After Payment
                    </p>
                    <p className="text-sm font-bold text-orange-600 font-mono">
                      {(
                        selectedCycleForPayment.balance - paymentFormData.amount
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Toggle Add Payment Button */}
          {!showAddPaymentForm &&
            selectedCycleForPayment?.status === "Active" && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowAddPaymentForm(true);
                    setPaymentFormData({
                      amount: 0,
                      paymentDate: new Date().toISOString().split("T")[0],
                      status: "Completed",
                    });
                    setPaymentAmountError("");
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark transition-colors"
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add Payment
                </button>
              </div>
            )}

          {/* Add Payment Form - Toggleable */}
          {showAddPaymentForm && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Add New Payment
                </h3>
                <button
                  onClick={() => {
                    setShowAddPaymentForm(false);
                    setPaymentFormData({
                      amount: 0,
                      paymentDate: new Date().toISOString().split("T")[0],
                      status: "Completed",
                    });
                    setPaymentAmountError("");
                  }}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  title="Cancel"
                >
                  <svg
                    className="w-6 h-6"
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
                </button>
              </div>
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentFormData.amount || ""}
                      onChange={(e) =>
                        handlePaymentAmountChange(e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 font-mono ${
                        paymentAmountError
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-zentyal-primary"
                      }`}
                      required
                      min="0.01"
                      placeholder="0.00"
                    />
                    {paymentAmountError && (
                      <p className="mt-1 text-sm text-red-600">
                        {paymentAmountError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={paymentFormData.paymentDate}
                      onChange={(e) =>
                        setPaymentFormData({
                          ...paymentFormData,
                          paymentDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zentyal-primary"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPaymentForm(false);
                      setPaymentFormData({
                        amount: 0,
                        paymentDate: new Date().toISOString().split("T")[0],
                        status: "Completed",
                      });
                      setPaymentAmountError("");
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !!paymentAmountError || paymentFormData.amount <= 0
                    }
                    className="px-4 py-2 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Add Payment
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Payment History - Hidden when add form is shown */}
          {!showAddPaymentForm && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Payment History
              </h3>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p>No payments recorded yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Date
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {
                              new Date(payment.datePaid)
                                .toISOString()
                                .split("T")[0]
                            }
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-mono">
                            {payment.amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={payment.status} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            {canDelete && (
                              <button
                                onClick={() =>
                                  handleDeletePaymentClick(
                                    payment._id,
                                    `Payment of ${payment.amount.toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )} on ${
                                      new Date(payment.datePaid)
                                        .toISOString()
                                        .split("T")[0]
                                    }`,
                                  )
                                }
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Payment"
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Payment Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeletePaymentModal}
        onClose={() => {
          setShowDeletePaymentModal(false);
          setDeletePaymentTarget(null);
        }}
        onConfirm={handleDeletePaymentConfirm}
        title="Delete Payment"
        message={`Are you sure you want to delete "${deletePaymentTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        requireReason={true}
        isLoading={false}
      />
    </div>
  );
}

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

export default function CyclePage() {
  const router = useRouter();
  const { loading: pageLoading, accessDenied } = usePageAccess();
  const { hasPermission, user: currentUser } = useAuth();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string>("");
  const [formData, setFormData] = useState({
    _id: "",
    loanId: "",
    cycleCount: 1,
    principal: 0,
    interestRate: 0,
    interestAmount: 0,
    totalDue: 0,
    dateDue: new Date().toISOString().split("T")[0],
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

  const canAdd = hasPermission("/admin/cycle", "Add");
  const canEdit = hasPermission("/admin/cycle", "Edit");
  const canDelete = hasPermission("/admin/cycle", "Delete");

  const fetchCycles = async (loanId?: string) => {
    try {
      setLoading(true);
      const url = loanId
        ? `/api/admin/cycle?loanId=${loanId}`
        : "/api/admin/cycle";
      const res = await fetch(url);
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

  const fetchLoans = async () => {
    try {
      const res = await fetch("/api/admin/loan");
      if (!res.ok) {
        console.error("Failed to fetch loans:", res.status, res.statusText);
        return;
      }
      const data = await res.json();
      console.log("Fetched loans:", data);
      console.log("Loans count:", data.length);
      const activeLoans = data.filter(
        (l: Loan & { status: string }) => l.status === "Active",
      );
      console.log("Active loans:", activeLoans);
      setLoans(activeLoans);
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchLoans();
      await fetchCycles();
    };
    fetchData();
  }, []);

  // Debug: Log loans state
  useEffect(() => {
    console.log("Loans state updated:", loans);
  }, [loans]);

  // Fetch cycles when loan selection changes
  useEffect(() => {
    if (selectedLoanId) {
      fetchCycles(selectedLoanId);
    } else {
      fetchCycles();
    }
  }, [selectedLoanId]);

  // Auto-populate fields when loan is selected in form
  useEffect(() => {
    const handleLoanSelection = async () => {
      if (!formData.loanId || isEditing) return;

      try {
        // Find the selected loan
        const selectedLoan = loans.find((l) => l._id === formData.loanId);
        if (!selectedLoan) return;

        // Fetch ALL cycles for this loan (including cancelled)
        const res = await fetch(`/api/admin/cycle?loanId=${formData.loanId}`);
        const cyclesData = await res.json();

        // For cycle count: Look at ALL cycles (including cancelled) to get next sequential number
        const allCyclesSorted = cyclesData.sort(
          (a: Cycle, b: Cycle) => b.cycleCount - a.cycleCount,
        );
        const maxCycleCount = allCyclesSorted[0]?.cycleCount || 0;
        const nextCycleCount = maxCycleCount + 1;

        // For principal: Only consider non-cancelled cycles to get the latest balance
        const activeCycles = cyclesData
          .filter((c: Cycle) => c.status !== "Cancelled")
          .sort((a: Cycle, b: Cycle) => b.cycleCount - a.cycleCount);

        const latestActiveCycle = activeCycles[0];

        // Determine principal: use latest active cycle's balance or loan's principal
        const principal = latestActiveCycle
          ? latestActiveCycle.balance
          : selectedLoan.principal;

        // Get interest rate from loan
        const interestRate = selectedLoan.interestRate;

        // Calculate interest amount: principal * (interestRate / 100)
        const interestAmount = principal * (interestRate / 100);

        // Calculate total due: principal + interestAmount
        const totalDue = principal + interestAmount;

        // Update form data with calculated values
        setFormData((prev) => ({
          ...prev,
          cycleCount: nextCycleCount,
          principal: Number(principal.toFixed(2)),
          interestRate: Number(interestRate.toFixed(2)),
          interestAmount: Number(interestAmount.toFixed(2)),
          totalDue: Number(totalDue.toFixed(2)),
        }));
      } catch (error) {
        console.error("Error fetching loan data:", error);
      }
    };

    handleLoanSelection();
  }, [formData.loanId, loans, isEditing]);

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
      // Frontend validation: Check for existing active cycle when creating new cycle
      if (!isEditing) {
        const existingActiveCycle = cycles.find(
          (cycle) =>
            cycle.loanId._id === formData.loanId &&
            cycle.status === "Active" &&
            cycle._id !== formData._id,
        );

        if (existingActiveCycle) {
          setErrorModal({
            isOpen: true,
            message:
              "Cannot create a new cycle. An active cycle already exists for this loan. Please complete or cancel the existing cycle first.",
          });
          setLoading(false);
          setShowLoadingModal(false);
          return;
        }
      }

      const url = isEditing
        ? `/api/admin/cycle/${formData._id}`
        : "/api/admin/cycle";
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
            ? "Cycle updated successfully! ✅"
            : "Cycle created successfully! 🎉",
        );
        resetForm();
        fetchCycles(selectedLoanId || undefined);
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

  const handleEdit = (cycle: Cycle) => {
    setFormData({
      _id: cycle._id,
      loanId: cycle.loanId._id,
      cycleCount: cycle.cycleCount,
      principal: cycle.principal,
      interestRate: cycle.interestRate,
      interestAmount: cycle.interestAmount,
      totalDue: cycle.totalDue,
      dateDue: new Date(cycle.dateDue).toISOString().split("T")[0],
      status: cycle.status,
    });
    setIsEditing(true);
    setShowFormModal(true);
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
        fetchCycles(selectedLoanId || undefined);
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

  const handleActivateConfirm = async () => {
    if (!activateTarget) return;

    setShowActivateModal(false);
    setShowLoadingModal(true);

    try {
      const res = await fetch(`/api/admin/cycle/${activateTarget.id}`, {
        method: "PATCH",
      });

      if (res.ok) {
        toast.success(
          `Cycle "${activateTarget.name}" activated successfully! ✅`,
        );
        fetchCycles(selectedLoanId || undefined);
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
    setShowFormModal(false);
  };

  const resetForm = () => {
    setFormData({
      _id: "",
      loanId: "",
      cycleCount: 1,
      principal: 0,
      interestRate: 0,
      interestAmount: 0,
      totalDue: 0,
      dateDue: new Date().toISOString().split("T")[0],
      status: "Active",
    });
    setIsEditing(false);
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
              Cycle Management
            </h1>
            <p className="text-gray-600">
              Manage loan cycles and payment schedules
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
              title="Add New Cycle"
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
              <span className="hidden sm:inline">Add New Cycle</span>
            </button>
          )}
        </div>

        {/* Loan Filter */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Loan
          </label>
          <div className="flex gap-2">
            <select
              value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                       focus:ring-zentyal-primary focus:border-transparent transition-all"
            >
              <option value="">All Loans</option>
              {loans.length === 0 ? (
                <option disabled>No active loans available</option>
              ) : (
                loans.map((loan) => (
                  <option key={loan._id} value={loan._id}>
                    {loan.loanNo} - {getClientFullName(loan.clientId)}
                  </option>
                ))
              )}
            </select>
            {selectedLoanId && (
              <button
                onClick={() => setSelectedLoanId("")}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Clear filter"
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
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cycles Table with DataTable Component */}
      <DataTable
        data={cycles}
        columns={[
          {
            key: "loanNo",
            label: "Loan No.",
            sortable: true,
            searchable: true,
            render: (cycle: Cycle) => (
              <span className="text-sm font-semibold text-zentyal-primary">
                {cycle.loanId.loanNo}
              </span>
            ),
            exportValue: (cycle: Cycle) => cycle.loanId.loanNo,
          },
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
            key: "clientName",
            label: "Client",
            sortable: true,
            searchable: true,
            render: (cycle: Cycle) => (
              <span className="text-sm text-gray-900">
                {getClientFullName(cycle.loanId.clientId)}
              </span>
            ),
            exportValue: (cycle: Cycle) =>
              getClientFullName(cycle.loanId.clientId),
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
                {new Date(cycle.dateDue).toLocaleDateString()}
              </span>
            ),
            exportValue: (cycle: Cycle) =>
              new Date(cycle.dateDue).toLocaleDateString(),
          },
          {
            key: "status",
            label: "Status",
            sortable: true,
            render: (cycle: Cycle) => (
              <div className="flex justify-end md:justify-center">
                <span
                  className={`inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full
                    ${
                      cycle.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : cycle.status === "Completed"
                          ? "bg-blue-100 text-blue-800"
                          : cycle.status === "Expired"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                    }`}
                >
                  {cycle.status}
                </span>
              </div>
            ),
            exportValue: (cycle: Cycle) => cycle.status,
          },
          {
            key: "actions",
            label: "Actions",
            sortable: false,
            searchable: false,
            render: (cycle: Cycle) => (
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <button
                  onClick={() => router.push(`/admin/cycle/${cycle._id}`)}
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
                {/* Hide Edit, Delete, and Activate buttons for Completed cycles */}
                {cycle.status !== "Completed" &&
                  canEdit &&
                  cycle.status !== "Cancelled" && (
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
                {cycle.status !== "Completed" &&
                  canEdit &&
                  (cycle.status === "Cancelled" ||
                    cycle.status === "Expired" ||
                    cycle.status === "Completed") && (
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
            ),
          },
        ]}
        loading={loading}
        emptyMessage="No cycles found"
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
        exportFileName="cycles"
        searchPlaceholder="Search cycles..."
        itemsPerPage={10}
      />

      {/* Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={handleCloseFormModal}
        title={isEditing ? "Edit Cycle" : "Create New Cycle"}
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Loan */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.loanId}
                onChange={(e) =>
                  setFormData({ ...formData, loanId: e.target.value })
                }
                required
                disabled={isEditing}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all
                         disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select a loan</option>
                {loans.length === 0 ? (
                  <option disabled>No active loans available</option>
                ) : (
                  loans.map((loan) => (
                    <option key={loan._id} value={loan._id}>
                      {loan.loanNo} - {getClientFullName(loan.clientId)}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Cycle Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cycle Count <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.cycleCount}
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                         bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Principal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Principal <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.principal}
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                         bg-gray-100 cursor-not-allowed"
              />
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
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                         bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Interest Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interest Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.interestAmount}
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                         bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Total Due */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Due <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.totalDue}
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg 
                         bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dateDue}
                onChange={(e) =>
                  setFormData({ ...formData, dateDue: e.target.value })
                }
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Status */}
            {isEditing && (
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
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Expired">Expired</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex gap-3 justify-end">
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
              disabled={loading}
              className="px-6 py-2.5 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark 
                       transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing ? "Update Cycle" : "Create Cycle"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Cancel Cycle"
        message={`Are you sure you want to cancel "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Cancel Cycle"
        cancelText="Keep Cycle"
        requireReason={true}
        isLoading={loading}
      />

      {/* Activate Confirmation Modal */}
      <ConfirmModal
        isOpen={showActivateModal}
        onClose={() => setShowActivateModal(false)}
        onConfirm={handleActivateConfirm}
        title="Activate Cycle"
        message={`Are you sure you want to activate "${activateTarget?.name}"?`}
        confirmText="Activate"
        cancelText="Cancel"
        requireReason={false}
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

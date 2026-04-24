"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageAccess } from "@/hooks/usePageAccess";
import { useAuth } from "@/context/AuthContext";
import PageNotFound from "@/components/PageNotFound";
import LoadingModal from "@/components/LoadingModal";
import ErrorModal from "@/components/ErrorModal";
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

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
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
  createdBy?: User;
  updatedBy?: User;
  deletedAt?: string;
  deletedBy?: User;
  deletedReason?: string;
}

export default function CycleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const cycleId = params.id as string;
  const { loading: pageLoading, accessDenied } = usePageAccess();
  const { user: currentUser } = useAuth();
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [formData, setFormData] = useState({
    loanId: "",
    cycleCount: 1,
    principal: 0,
    interestRate: 0,
    interestAmount: 0,
    totalDue: 0,
    totalPaid: 0,
    balance: 0,
    profitExpected: 0,
    profitEarned: 0,
    profitRemaining: 0,
    dateDue: new Date().toISOString().split("T")[0],
    status: "Active",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: "",
  });

  const fetchCycle = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/cycle/${cycleId}`);
      if (res.ok) {
        const data = await res.json();
        setCycle(data);
        setFormData({
          loanId: data.loanId._id,
          cycleCount: data.cycleCount,
          principal: data.principal,
          interestRate: data.interestRate,
          interestAmount: data.interestAmount,
          totalDue: data.totalDue,
          totalPaid: data.totalPaid,
          balance: data.balance,
          profitExpected: data.profitExpected,
          profitEarned: data.profitEarned,
          profitRemaining: data.profitRemaining,
          dateDue: new Date(data.dateDue).toISOString().split("T")[0],
          status: data.status,
        });
      } else {
        router.push("/admin/cycle");
      }
    } catch (error) {
      console.error("Error fetching cycle:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to fetch cycle details. Please try again.",
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
      await fetchCycle();
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleId]);

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

  if (!cycle) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowLoadingModal(true);

    try {
      const res = await fetch(`/api/admin/cycle/${cycleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          updatedBy: currentUser?._id,
        }),
      });

      if (res.ok) {
        toast.success("Cycle updated successfully! ✅");
        setIsEditing(false);
        await fetchCycle();
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

  const getClientFullName = (client: Client) => {
    const parts = [client.firstName];
    if (client.middleName) parts.push(client.middleName);
    parts.push(client.lastName);
    return parts.join(" ");
  };

  return (
    // <div className="max-w-5xl mx-auto pb-8">
    // <div className="max-w-5xl mx-auto mt-10 md:mt-0">
    <div className="max-w-7xl mx-auto mt-10 md:mt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-10 md:mt-0">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.push("/admin/cycle")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Cycles"
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
              Cycle #{cycle.cycleCount}
            </h1>
            <span
              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full
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
          <p className="text-gray-600">
            {cycle.loanId.loanNo} - {getClientFullName(cycle.loanId.clientId)}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
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
                      setFormData({ ...formData, loanId: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
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
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                    {cycle.loanId.loanNo} -{" "}
                    {getClientFullName(cycle.loanId.clientId)}
                  </div>
                )}
              </div>

              {/* Cycle Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cycle Count <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    value={formData.cycleCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cycleCount: Number(e.target.value),
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-mono font-bold">
                    #{cycle.cycleCount}
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
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
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                    {new Date(cycle.dateDue).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Details Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-zentyal-primary">
              Financial Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Principal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Principal () <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-mono">
                    {cycle.principal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                )}
              </div>

              {/* Interest Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interest Rate (%) <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-mono">
                    {cycle.interestRate}%
                  </div>
                )}
              </div>

              {/* Interest Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interest Amount () <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.interestAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        interestAmount: Number(e.target.value),
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-mono">
                    {cycle.interestAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                )}
              </div>

              {/* Total Due */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Due () <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalDue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalDue: Number(e.target.value),
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-blue-50 rounded-lg text-blue-900 font-mono font-bold">
                    {cycle.totalDue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                )}
              </div>

              {/* Total Paid */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Paid ()
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalPaid}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalPaid: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-green-50 rounded-lg text-green-900 font-mono font-bold">
                    {cycle.totalPaid.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                )}
              </div>

              {/* Balance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Balance () <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.balance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        balance: Number(e.target.value),
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-red-50 rounded-lg text-red-900 font-mono font-bold">
                    {cycle.balance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profit Tracking Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-zentyal-primary">
              Profit Tracking
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profit Expected */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profit Expected () <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.profitExpected}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        profitExpected: Number(e.target.value),
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-mono">
                    {cycle.profitExpected.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                )}
              </div>

              {/* Profit Earned */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profit Earned ()
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
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
                ) : (
                  <div className="px-4 py-2.5 bg-green-50 rounded-lg text-green-900 font-mono font-bold">
                    {cycle.profitEarned.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                )}
              </div>

              {/* Profit Remaining */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profit Remaining () <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.profitRemaining}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        profitRemaining: Number(e.target.value),
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-zentyal-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <div className="px-4 py-2.5 bg-yellow-50 rounded-lg text-yellow-900 font-mono font-bold">
                    {cycle.profitRemaining.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-zentyal-primary">
              Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cycle Status
                </label>
                {isEditing ? (
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
                ) : (
                  <div className="px-4 py-2.5 bg-gray-50 rounded-lg">
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full
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
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          {isEditing && (
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 bg-zentyal-primary text-white rounded-lg 
                         hover:bg-zentyal-dark transition-all duration-200 shadow-lg hover:shadow-xl 
                         transform hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Audit Trail */}
      {!isEditing && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-zentyal-primary">
            Audit Trail
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Created At</p>
              <p className="text-gray-900 font-medium">
                {new Date(cycle.createdAt).toLocaleString()}
              </p>
            </div>
            {cycle.createdBy && (
              <div>
                <p className="text-sm text-gray-600">Created By</p>
                <p className="text-gray-900 font-medium">
                  {cycle.createdBy.firstName} {cycle.createdBy.lastName}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-gray-900 font-medium">
                {new Date(cycle.updatedAt).toLocaleString()}
              </p>
            </div>
            {cycle.updatedBy && (
              <div>
                <p className="text-sm text-gray-600">Updated By</p>
                <p className="text-gray-900 font-medium">
                  {cycle.updatedBy.firstName} {cycle.updatedBy.lastName}
                </p>
              </div>
            )}
            {cycle.deletedAt && (
              <>
                <div>
                  <p className="text-sm text-gray-600">Deleted At</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(cycle.deletedAt).toLocaleString()}
                  </p>
                </div>
                {cycle.deletedBy && (
                  <div>
                    <p className="text-sm text-gray-600">Deleted By</p>
                    <p className="text-gray-900 font-medium">
                      {cycle.deletedBy.firstName} {cycle.deletedBy.lastName}
                    </p>
                  </div>
                )}
                {cycle.deletedReason && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Deletion Reason</p>
                    <p className="text-gray-900 font-medium">
                      {cycle.deletedReason}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <LoadingModal
        isOpen={showLoadingModal}
        message="Processing your request..."
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: "" })}
        message={errorModal.message}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageAccess } from "@/hooks/usePageAccess";
import {
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowLeftIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { LoadingSpinner, StatusBadge } from "@/components/CRUDComponents";
import PageNotFound from "@/components/PageNotFound";
import ErrorModal from "@/components/ErrorModal";
import Modal from "@/components/Modal";
import DataTable, { Column } from "@/components/DataTable";

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
  createdBy?: User;
  updatedBy?: User;
  deletedAt?: string;
  deletedBy?: User;
  deletedReason?: string;
}

interface Cycle {
  _id: string;
  loanId: string;
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

export default function LoanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { loading: pageLoading, accessDenied } = usePageAccess();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [cyclesLoading, setCyclesLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: "",
  });

  useEffect(() => {
    if (id) {
      fetchLoan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (accessDenied) {
    return <PageNotFound />;
  }

  const fetchLoan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/loan/${id}`);
      if (res.ok) {
        const data = await res.json();
        setLoan(data);
      } else {
        setErrorModal({
          isOpen: true,
          message: "Loan not found. Redirecting to loan list...",
        });
        setTimeout(() => router.push("/admin/loan"), 2000);
      }
    } catch (error) {
      console.error("Error fetching loan:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to fetch loan details. Please try again.",
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

  // Format date to YYYY-MM-DD
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Format datetime to YYYY-MM-DD HH:MM:SS
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const datePart = date.toISOString().split("T")[0];
    const timePart = date.toTimeString().split(" ")[0];
    return `${datePart} ${timePart}`;
  };

  const fetchCycles = async () => {
    setCyclesLoading(true);
    try {
      const res = await fetch(`/api/admin/cycle?loanId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setCycles(data);
        setShowCycleModal(true);
      } else {
        setErrorModal({
          isOpen: true,
          message: "Failed to fetch cycles. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error fetching cycles:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to fetch cycles. Please try again.",
      });
    } finally {
      setCyclesLoading(false);
    }
  };

  const cycleColumns: Column<Cycle>[] = [
    {
      key: "cycleCount",
      label: "Cycle #",
      sortable: true,
      searchable: true,
      render: (cycle) => (
        <span className="font-semibold text-zentyal-primary">
          Cycle {cycle.cycleCount}
        </span>
      ),
    },
    {
      key: "principal",
      label: "Principal",
      sortable: true,
      searchable: false,
      render: (cycle) => (
        <span className="font-medium">
          {cycle.principal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      key: "interestRate",
      label: "Interest Rate",
      sortable: true,
      searchable: false,
      render: (cycle) => <span>{cycle.interestRate.toFixed(2)}%</span>,
    },
    {
      key: "interestAmount",
      label: "Interest Amount",
      sortable: true,
      searchable: false,
      render: (cycle) => (
        <span>
          {cycle.interestAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      key: "totalDue",
      label: "Total Due",
      sortable: true,
      searchable: false,
      render: (cycle) => (
        <span className="font-semibold text-gray-900">
          {cycle.totalDue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      key: "totalPaid",
      label: "Total Paid",
      sortable: true,
      searchable: false,
      render: (cycle) => (
        <span className="text-green-600">
          {cycle.totalPaid.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      key: "balance",
      label: "Balance",
      sortable: true,
      searchable: false,
      render: (cycle) => (
        <span className="font-semibold text-red-600">
          {cycle.balance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      key: "dateDue",
      label: "Due Date",
      sortable: true,
      searchable: false,
      render: (cycle) => <span>{formatDate(cycle.dateDue)}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      searchable: true,
      render: (cycle) => <StatusBadge status={cycle.status} />,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    // <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
    <div className="max-w-5xl mx-auto mt-10 md:mt-0">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/admin/loan")}
          className="flex items-center text-zentyal-primary hover:text-zentyal-dark mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Loans
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Loan Details</h1>
            <p className="text-gray-600 mt-1">View loan information</p>
          </div>
          {loan && (
            <div className="flex flex-col sm:flex-row gap-2">
              <StatusBadge status={loan.status} />
              <button
                onClick={fetchCycles}
                disabled={cyclesLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cyclesLoading ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    <span className="hidden sm:inline">Loading...</span>
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Show Loan Cycles</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cycles Modal */}
      <Modal
        isOpen={showCycleModal}
        onClose={() => setShowCycleModal(false)}
        title={`Loan Cycles - ${loan?.loanNo || ""}`}
        size="2xl"
      >
        <div className="p-1">
          {cycles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No cycles found for this loan.</p>
            </div>
          ) : (
            <DataTable
              data={cycles}
              columns={cycleColumns}
              itemsPerPage={10}
              loading={cyclesLoading}
              emptyMessage="No cycles found"
              exportFileName={`loan-cycles-${loan?.loanNo || "export"}`}
              searchPlaceholder="Search cycles..."
            />
          )}
        </div>
      </Modal>

      {/* Loan Information */}
      {loan && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Loan Information */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <CurrencyDollarIcon className="w-6 h-6 mr-2 text-zentyal-primary" />
              Loan Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Loan Number</p>
                <p className="text-lg font-bold text-zentyal-primary">
                  {loan.loanNo}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Client</p>
                <p className="text-base font-semibold text-gray-900">
                  {getClientFullName(loan.clientId)}
                </p>
                <p className="text-sm text-gray-600">{loan.clientId.email}</p>
                <p className="text-sm text-gray-600">{loan.clientId.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Assigned Staff</p>
                <p className="text-base font-semibold text-gray-900">
                  {loan.assignedStaff.firstName} {loan.assignedStaff.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  {loan.assignedStaff.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Principal Amount</p>
                <p className="text-2xl font-bold text-zentyal-primary">
                  {loan.principal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Interest Rate</p>
                <p className="text-2xl font-bold text-zentyal-primary">
                  {loan.interestRate.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Terms</p>
                <p className="text-base font-semibold text-gray-900">
                  {loan.terms}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Date Started</p>
                <p className="text-base font-semibold text-gray-900 flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2 text-gray-400" />
                  {formatDate(loan.dateStarted)}
                </p>
              </div>
            </div>
          </div>

          {/* Audit Information */}
          <div className="p-6 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <ClockIcon className="w-6 h-6 mr-2 text-zentyal-primary" />
              Audit Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Created At</p>
                <p className="text-base text-gray-900">
                  {formatDateTime(loan.createdAt)}
                </p>
                {loan.createdBy && (
                  <p className="text-sm text-gray-600">
                    by {loan.createdBy.firstName} {loan.createdBy.lastName}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                <p className="text-base text-gray-900">
                  {formatDateTime(loan.updatedAt)}
                </p>
                {loan.updatedBy && (
                  <p className="text-sm text-gray-600">
                    by {loan.updatedBy.firstName} {loan.updatedBy.lastName}
                  </p>
                )}
              </div>
              {loan.deletedAt && (
                <>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Cancelled At</p>
                    <p className="text-base text-gray-900">
                      {formatDateTime(loan.deletedAt)}
                    </p>
                    {loan.deletedBy && (
                      <p className="text-sm text-gray-600">
                        by {loan.deletedBy.firstName} {loan.deletedBy.lastName}
                      </p>
                    )}
                  </div>
                  {loan.deletedReason && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Cancellation Reason
                      </p>
                      <p className="text-base text-gray-900">
                        {loan.deletedReason}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: "" })}
        message={errorModal.message}
      />
    </div>
  );
}

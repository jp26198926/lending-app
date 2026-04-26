"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageAccess } from "@/hooks/usePageAccess";
import PageNotFound from "@/components/PageNotFound";
import ErrorModal from "@/components/ErrorModal";

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
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: "",
  });

  const fetchPayment = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/payment/${paymentId}`);
      if (res.ok) {
        const data = await res.json();
        setPayment(data);
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

  useEffect(() => {
    fetchPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId]);

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

      {/* Payment Details */}
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
              <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-mono font-semibold">
                {payment.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            {/* Date Paid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Paid <span className="text-red-500">*</span>
              </label>
              <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                {new Date(payment.datePaid).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <div className="px-4 py-2.5 bg-gray-50 rounded-lg">
                <span
                  className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(payment.status)}`}
                >
                  {payment.status}
                </span>
              </div>
            </div>

            {/* Remarks */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 min-h-20">
                {payment.remarks || "No remarks"}
              </div>
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
              <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                {payment.loanId.loanNo} -{" "}
                {getClientFullName(payment.loanId.clientId)}
              </div>
            </div>

            {/* Cycle */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cycle <span className="text-red-500">*</span>
              </label>
              <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 font-medium">
                Cycle #{payment.cycleId.cycleCount} - Due:{" "}
                {new Date(payment.cycleId.dateDue).toLocaleDateString()}
              </div>
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
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        message={errorModal.message}
        onClose={() => setErrorModal({ isOpen: false, message: "" })}
      />
    </div>
  );
}

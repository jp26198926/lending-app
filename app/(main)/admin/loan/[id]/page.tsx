"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageAccess } from "@/hooks/usePageAccess";
import { useAuth } from "@/context/AuthContext";
import {
  UserCircleIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowLeftIcon,
  PencilIcon,
  ClockIcon,
  TrashIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { LoadingSpinner, StatusBadge } from "@/components/CRUDComponents";
import ConfirmModal from "@/components/ConfirmModal";
import LoadingModal from "@/components/LoadingModal";
import PageNotFound from "@/components/PageNotFound";
import ErrorModal from "@/components/ErrorModal";
import toast from "react-hot-toast";

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

export default function LoanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === "new";

  const { loading: pageLoading, accessDenied } = usePageAccess();
  const { hasPermission, user: currentUser } = useAuth();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [isEditing, setIsEditing] = useState(isNew);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: "",
  });

  const [formData, setFormData] = useState({
    clientId: "",
    principal: 0,
    interestRate: 0,
    terms: "Weekly",
    dateStarted: new Date().toISOString().split("T")[0],
    assignedStaff: "",
    status: "Active",
  });

  const canEdit = hasPermission("/admin/loan", "Edit");
  const canDelete = hasPermission("/admin/loan", "Delete");
  const canAdd = hasPermission("/admin/loan", "Add");

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchClients(), fetchUsers()]);
      if (!isNew && id) {
        fetchLoan();
      }
    };
    fetchData();
  }, [id, isNew]);

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

  if (isNew && !canAdd) {
    return <PageNotFound />;
  }

  const fetchLoan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/loan/${id}`);
      if (res.ok) {
        const data = await res.json();
        setLoan(data);
        setFormData({
          clientId: data.clientId._id,
          principal: data.principal,
          interestRate: data.interestRate,
          terms: data.terms,
          dateStarted: new Date(data.dateStarted).toISOString().split("T")[0],
          assignedStaff: data.assignedStaff._id,
          status: data.status,
        });
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

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/admin/client");
      const data = await res.json();
      setClients(
        data.filter((c: Client & { status: string }) => c.status === "ACTIVE"),
      );
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/user");
      const data = await res.json();
      setUsers(
        data.filter((u: User & { status: string }) => u.status === "ACTIVE"),
      );
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowLoadingModal(true);

    try {
      const url = isNew ? "/api/admin/loan" : `/api/admin/loan/${id}`;
      const method = isNew ? "POST" : "PUT";

      const payload = {
        ...formData,
        [isNew ? "createdBy" : "updatedBy"]: currentUser?._id,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(
          isNew
            ? "Loan created successfully! 🎉"
            : "Loan updated successfully! ✅",
        );
        if (isNew) {
          const data = await res.json();
          router.push(`/admin/loan/${data._id}`);
        } else {
          setIsEditing(false);
          fetchLoan();
        }
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
      setShowLoadingModal(false);
    }
  };

  const handleDelete = async (reason?: string) => {
    if (!reason) return;

    setShowDeleteModal(false);
    setShowLoadingModal(true);

    try {
      const res = await fetch(
        `/api/admin/loan/${id}?deletedBy=${currentUser?._id}&deletedReason=${encodeURIComponent(reason)}`,
        { method: "DELETE" },
      );

      if (res.ok) {
        toast.success("Loan cancelled successfully! 🗑️");
        router.push("/admin/loan");
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

  const handleCancel = () => {
    if (isNew) {
      router.push("/admin/loan");
    } else {
      setIsEditing(false);
      if (loan) {
        setFormData({
          clientId: loan.clientId._id,
          principal: loan.principal,
          interestRate: loan.interestRate,
          terms: loan.terms,
          dateStarted: new Date(loan.dateStarted).toISOString().split("T")[0],
          assignedStaff: loan.assignedStaff._id,
          status: loan.status,
        });
      }
    }
  };

  const getClientFullName = (client: Client) => {
    const parts = [client.firstName];
    if (client.middleName) parts.push(client.middleName);
    parts.push(client.lastName);
    return parts.join(" ");
  };

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
            <h1 className="text-3xl font-bold text-gray-800">
              {isNew ? "Create New Loan" : "Loan Details"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isNew
                ? "Add a new loan to the system"
                : isEditing
                  ? "Edit loan information"
                  : "View loan information"}
            </p>
          </div>
          {!isNew && loan && (
            <div className="flex gap-2">
              <StatusBadge status={loan.status} />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {!isNew && loan && !isEditing && (
        <div className="mb-6 flex flex-wrap gap-3 justify-center sm:justify-start">
          {canEdit && loan.status !== "Cancelled" && (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-zentyal-primary text-white rounded-lg 
                       hover:bg-zentyal-dark transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <PencilIcon className="w-5 h-5" />
              <span>Edit Loan</span>
            </button>
          )}
          {canDelete && loan.status === "Active" && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg 
                       hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <TrashIcon className="w-5 h-5" />
              <span>Cancel Loan</span>
            </button>
          )}
        </div>
      )}

      {/* Form */}
      {(isNew || isEditing) && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.clientId}
                onChange={(e) =>
                  setFormData({ ...formData, clientId: e.target.value })
                }
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {getClientFullName(client)}
                  </option>
                ))}
              </select>
            </div>

            {/* Principal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Principal Amount () <span className="text-red-500">*</span>
              </label>
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
                placeholder="0.00"
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    interestRate: Number(e.target.value),
                  })
                }
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
                placeholder="0.00"
              />
            </div>

            {/* Terms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terms <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.terms}
                onChange={(e) =>
                  setFormData({ ...formData, terms: e.target.value })
                }
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              >
                <option value="Weekly">Weekly</option>
                <option value="Fortnightly">Fortnightly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            {/* Date Started */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Started <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dateStarted}
                onChange={(e) =>
                  setFormData({ ...formData, dateStarted: e.target.value })
                }
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Assigned Staff */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Staff <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.assignedStaff}
                onChange={(e) =>
                  setFormData({ ...formData, assignedStaff: e.target.value })
                }
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              >
                <option value="">Select staff</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            {!isNew && (
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
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark 
                       transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
            >
              {isNew ? "Create Loan" : "Update Loan"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="w-full sm:w-auto px-8 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 
                       transition-all duration-200 font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* View Mode */}
      {!isNew && loan && !isEditing && (
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
                  {new Date(loan.dateStarted).toLocaleDateString()}
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
                  {new Date(loan.createdAt).toLocaleString()}
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
                  {new Date(loan.updatedAt).toLocaleString()}
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
                      {new Date(loan.deletedAt).toLocaleString()}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Cancel Loan"
        message="Are you sure you want to cancel this loan? This action cannot be undone."
        confirmText="Cancel Loan"
        requireReason={true}
      />

      {/* Loading Modal */}
      <LoadingModal isOpen={showLoadingModal} message="Processing..." />

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: "" })}
        message={errorModal.message}
      />
    </div>
  );
}

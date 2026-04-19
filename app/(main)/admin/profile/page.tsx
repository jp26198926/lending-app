"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
  UserIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { LoadingSpinner, StatusBadge } from "@/components/CRUDComponents";
import ErrorModal from "@/components/ErrorModal";
import SuccessModal from "@/components/SuccessModal";
import Modal from "@/components/Modal";
import LoadingModal from "@/components/LoadingModal";
import DataTable from "@/components/DataTable";

interface ProfileUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roleId: {
    _id: string;
    role: string;
  };
  rate: number;
  cashWithdrawable: number;
  capitalContribution: number;
  profitEarned: number;
  totalWithdrawn: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface UserLedger {
  _id: string;
  date: string;
  amount: number;
  type: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  loanId?: {
    _id: string;
    loanNo: string;
  };
  status: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: "",
  });
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    message: "",
  });

  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Ledger modal state
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgers, setLedgers] = useState<UserLedger[]>([]);
  const [loadingLedgers, setLoadingLedgers] = useState(false);

  // Withdrawal modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  useEffect(() => {
    // Wait for auth to finish loading
    if (!authLoading) {
      if (!authUser) {
        // Not logged in, redirect to login
        router.push("/login");
      } else {
        // Logged in, fetch profile
        fetchProfile();
      }
    }
  }, [authLoading, authUser, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/profile");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch profile");
      }

      setProfile(result.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setErrorModal({
        isOpen: true,
        message:
          error instanceof Error ? error.message : "Failed to load profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLedgers = async () => {
    if (!profile) return;

    try {
      setLoadingLedgers(true);
      const response = await fetch(`/api/profile/userledger?status=Completed`);

      if (!response.ok) {
        throw new Error("Failed to fetch ledgers");
      }

      const data = await response.json();
      setLedgers(data);
    } catch (error) {
      console.error("Error fetching ledgers:", error);
      setErrorModal({
        isOpen: true,
        message:
          error instanceof Error ? error.message : "Failed to load ledgers",
      });
    } finally {
      setLoadingLedgers(false);
    }
  };

  const handleViewLedger = () => {
    setShowLedgerModal(true);
    fetchUserLedgers();
  };

  const handleWithdraw = async () => {
    // Reset error
    setWithdrawError("");

    // Validate amount
    const amount = parseFloat(withdrawAmount);
    if (!withdrawAmount || isNaN(amount) || amount <= 0) {
      setWithdrawError("Please enter a valid amount");
      return;
    }

    if (profile && amount > (profile.cashWithdrawable || 0)) {
      setWithdrawError(
        `Insufficient balance. Available: ${formatCurrency(profile.cashWithdrawable)}`,
      );
      return;
    }

    try {
      setWithdrawing(true);

      const response = await fetch("/api/profile/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process withdrawal");
      }

      // Success - close modal and reset form
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setWithdrawError("");

      // Refresh profile to show updated balances
      await fetchProfile();

      // Show success message
      setSuccessModal({
        isOpen: true,
        message: `Withdrawal successful! Amount: ${formatCurrency(amount)}`,
      });
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      setWithdrawError(
        error instanceof Error ? error.message : "Failed to process withdrawal",
      );
    } finally {
      setWithdrawing(false);
    }
  };

  const closeWithdrawModal = () => {
    if (!withdrawing) {
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setWithdrawError("");
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    // return new Intl.NumberFormat("en-US", {
    //   style: "currency",
    //   currency: "PHP",
    // }).format(amount || 0);
    return (amount || 0).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePasswordChange = async () => {
    // Reset error
    setPasswordError("");

    // Validate form
    if (
      !passwordForm.oldPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError("All fields are required");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return;
    }

    if (passwordForm.oldPassword === passwordForm.newPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to change password");
      }

      // Success - close modal and reset form
      setShowPasswordModal(false);
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordError("");

      // Show success message
      setSuccessModal({
        isOpen: true,
        message: "Password changed successfully!",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError(
        error instanceof Error ? error.message : "Failed to change password",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const closePasswordModal = () => {
    if (!changingPassword) {
      setShowPasswordModal(false);
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordError("");
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  };

  // Show loading during auth check
  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  // If not logged in, show nothing (will redirect)
  if (!authUser) {
    return null;
  }

  // If no profile data loaded yet, show loading
  if (!profile) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 px-3 py-4 sm:px-6 sm:py-8">
      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: "" })}
        message={errorModal.message}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, message: "" })}
        message={successModal.message}
      />

      {/* Loading Modal */}
      <LoadingModal isOpen={changingPassword} message="Changing password..." />
      <LoadingModal isOpen={withdrawing} message="Processing withdrawal..." />

      {/* Withdraw Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={closeWithdrawModal}
        title="Withdraw Cash"
        size="md"
      >
        <div className="space-y-4">
          {/* Error Message */}
          {withdrawError && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{withdrawError}</p>
            </div>
          )}

          {/* Available Balance */}
          <div className="rounded-md bg-green-50 p-3">
            <p className="text-sm font-medium text-green-800">
              Available Balance:{" "}
              {formatCurrency(profile?.cashWithdrawable || 0)}
            </p>
          </div>

          {/* Withdrawal Amount */}
          <div>
            <label
              htmlFor="withdrawAmount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Withdrawal Amount
            </label>
            <input
              type="number"
              id="withdrawAmount"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Enter amount to withdraw"
              disabled={withdrawing}
              min="0"
              step="0.01"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              onClick={closeWithdrawModal}
              disabled={withdrawing}
              className="w-full sm:flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={withdrawing}
              className="w-full sm:flex-1 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Withdraw
            </button>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={closePasswordModal}
        title="Change Password"
        size="md"
      >
        <div className="space-y-4">
          {/* Error Message */}
          {passwordError && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{passwordError}</p>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label
              htmlFor="oldPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Current Password
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                id="oldPassword"
                value={passwordForm.oldPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    oldPassword: e.target.value,
                  })
                }
                className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="Enter current password"
                disabled={changingPassword}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showOldPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="Enter new password (min 6 characters)"
                disabled={changingPassword}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="Re-enter new password"
                disabled={changingPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              onClick={closePasswordModal}
              disabled={changingPassword}
              className="w-full sm:flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handlePasswordChange}
              disabled={changingPassword}
              className="w-full sm:flex-1 px-4 py-2 text-sm font-semibold text-white bg-orange-600 rounded-md hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Change Password
            </button>
          </div>
        </div>
      </Modal>

      {/* <div className="mx-auto max-w-4xl"> */}
      <div className="max-w-7xl mx-auto mt-10 md:mt-0">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              My Profile
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              View and manage your account information
            </p>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-md bg-orange-600 px-3 sm:px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500"
          >
            <KeyIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Change Password</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          {/* Header Section with Avatar */}
          <div className="bg-linear-to-r from-orange-500 to-yellow-500 px-4 py-6 sm:px-6 sm:py-8">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="rounded-full bg-white p-3">
                <UserCircleIcon className="h-16 w-16 sm:h-20 sm:w-20 text-orange-600" />
              </div>
              <div className="text-center sm:text-left text-white">
                <h2 className="text-2xl sm:text-3xl font-bold">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="mt-1 text-sm sm:text-base opacity-90">
                  {profile.roleId.role}
                </p>
                <div className="mt-2">
                  <StatusBadge status={profile.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div className="flex items-start gap-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">
                    Email Address
                  </p>
                  <p className="mt-1 text-sm sm:text-base text-gray-900 wrap-break-word">
                    {profile.email}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3">
                <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">
                    Phone Number
                  </p>
                  <p className="mt-1 text-sm sm:text-base text-gray-900">
                    {profile.phone}
                  </p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-start gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">
                    Role
                  </p>
                  <p className="mt-1 text-sm sm:text-base text-gray-900">
                    {profile.roleId.role}
                  </p>
                </div>
              </div>

              {/* Rate */}
              <div className="flex items-start gap-3">
                <ChartBarIcon className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">
                    Rate
                  </p>
                  <p className="mt-1 text-sm sm:text-base text-gray-900">
                    {profile.rate}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Financial Information
              </h3>
              <button
                onClick={handleViewLedger}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-zentyal-primary text-white 
                         rounded-lg hover:bg-orange-600 transition-colors duration-200 text-sm font-medium
                         w-full sm:w-auto"
              >
                <BanknotesIcon className="h-5 w-5" />
                <span>View Ledger</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Profit Earned */}
              {/* <div className="flex items-start gap-3 sm:col-span-2"> */}
              <div className="flex items-start gap-3">
                <TrophyIcon className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">
                    Profit Earned
                  </p>
                  <p className="mt-1 text-sm sm:text-base font-semibold text-orange-600">
                    {formatCurrency(profile.profitEarned)}
                  </p>
                </div>
              </div>

              {/* Capital Contribution */}
              <div className="flex items-start gap-3">
                <CurrencyDollarIcon className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">
                    Capital Contribution
                  </p>
                  <p className="mt-1 text-sm sm:text-base font-semibold text-blue-600">
                    {formatCurrency(profile.capitalContribution)}
                  </p>
                </div>
              </div>

              {/* Cash Withdrawable */}
              <div className="flex items-start gap-3">
                <BanknotesIcon className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">
                      Cash Withdrawable
                    </p>
                    {(profile.cashWithdrawable || 0) > 0 && (
                      <button
                        onClick={() => setShowWithdrawModal(true)}
                        className="px-2 sm:px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-500 transition-colors"
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm sm:text-base font-semibold text-green-600">
                    {formatCurrency(profile.cashWithdrawable)}
                  </p>
                </div>
              </div>

              {/* Total Withdrawn */}
              {/* <div className="flex items-start gap-3 sm:col-span-2"> */}
              <div className="flex items-start gap-3">
                <BanknotesIcon className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">
                    Total Withdrawn
                  </p>
                  <p className="mt-1 text-sm sm:text-base font-semibold text-red-600">
                    {formatCurrency(profile.totalWithdrawn)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Account Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Created At */}
              <div className="flex items-start gap-3">
                <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">
                    Account Created
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-gray-600">
                    {formatDate(profile.createdAt)}
                  </p>
                </div>
              </div>

              {/* Updated At */}
              <div className="flex items-start gap-3">
                <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">
                    Last Updated
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-gray-600">
                    {formatDate(profile.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Modal */}
      <Modal
        isOpen={showLedgerModal}
        onClose={() => setShowLedgerModal(false)}
        title="User Ledger History"
        size="xl"
      >
        <div className="p-2">
          {loadingLedgers ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <DataTable
              data={ledgers}
              columns={[
                {
                  key: "date",
                  label: "Date",
                  sortable: true,
                  searchable: true,
                  render: (ledger: UserLedger) => (
                    <span className="text-sm text-gray-900">
                      {formatDate(ledger.date)}
                    </span>
                  ),
                  exportValue: (ledger: UserLedger) => formatDate(ledger.date),
                },
                {
                  key: "type",
                  label: "Type",
                  sortable: true,
                  searchable: true,
                  render: (ledger: UserLedger) => (
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ledger.type === "CAPITAL_IN"
                          ? "bg-blue-100 text-blue-800"
                          : ledger.type === "EARNING"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {ledger.type.replace("_", " ")}
                    </span>
                  ),
                  exportValue: (ledger: UserLedger) =>
                    ledger.type.replace("_", " "),
                },
                {
                  key: "amount",
                  label: "Amount",
                  sortable: true,
                  render: (ledger: UserLedger) => (
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(ledger.amount)}
                      </span>
                    </div>
                  ),
                  exportValue: (ledger: UserLedger) =>
                    `₱${formatCurrency(ledger.amount)}`,
                },
                {
                  key: "loanId",
                  label: "Loan",
                  sortable: false,
                  searchable: true,
                  render: (ledger: UserLedger) => (
                    <span className="text-sm text-gray-600">
                      {ledger.loanId?.loanNo || "-"}
                    </span>
                  ),
                  exportValue: (ledger: UserLedger) =>
                    ledger.loanId?.loanNo || "-",
                },
                {
                  key: "status",
                  label: "Status",
                  sortable: true,
                  render: (ledger: UserLedger) => (
                    <div className="flex justify-end md:justify-center">
                      <StatusBadge status={ledger.status} />
                    </div>
                  ),
                  exportValue: (ledger: UserLedger) => ledger.status,
                },
              ]}
              itemsPerPage={10}
              loading={false}
              emptyMessage="No ledger records found"
              exportFileName="user-ledger-history"
              searchPlaceholder="Search ledger records..."
            />
          )}
        </div>
      </Modal>
    </div>
  );
}

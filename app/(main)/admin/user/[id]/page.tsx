"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  TrophyIcon,
  ArrowLeftIcon,
  PencilIcon,
  ClockIcon,
  UserIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { LoadingSpinner, StatusBadge } from "@/components/CRUDComponents";
import ErrorModal from "@/components/ErrorModal";

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  phone: string;
  roleId: {
    _id: string;
    role: string;
    status: string;
  };
  rate: number;
  cashReceivable: number;
  capitalContribution: number;
  profitEarned: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  deletedAt?: string;
  deletedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  deletedReason?: string;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: "",
  });

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/admin/user/${id}`);
      const data = await res.json();

      if (data) {
        setUser(data);
      } else {
        setErrorModal({
          isOpen: true,
          message: "User not found. Redirecting to user list...",
        });
        setTimeout(() => router.push("/admin/user"), 2000);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setErrorModal({
        isOpen: true,
        message: "Failed to fetch user details. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            User not found
          </h3>
          <button
            onClick={() => router.push("/admin/user")}
            className="mt-4 px-4 py-2 bg-zentyal-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Back to User List
          </button>
        </div>
      </div>
    );
  }

  const fullName = [user.firstName, user.middleName, user.lastName, user.suffix]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="p-1 max-w-7xl mx-auto mt-10 md:mt-0">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/user")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
            <p className="text-sm text-gray-500 mt-1">
              Detailed information and financial overview
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/admin/user`)}
            className="px-3 sm:px-4 py-2 bg-zentyal-accent text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-2 shadow-md"
          >
            <PencilIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Edit User</span>
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-zentyal-primary rounded-xl shadow-xl p-8 mb-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            {/* <div className="bg-white/20 backdrop-blur-sm rounded-full p-6">
              <UserCircleIcon className="h-20 w-20" />
            </div> */}
            <div>
              <h2 className="text-3xl font-bold mb-2">{fullName}</h2>
              <div className="flex items-center gap-2 text-orange-100 mb-3">
                <EnvelopeIcon className="h-5 w-5" />
                <span className="text-lg">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-orange-100">
                <PhoneIcon className="h-5 w-5" />
                <span className="text-lg">{user.phone}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <StatusBadge status={user.status} />
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="flex items-center gap-2 justify-end">
                <ShieldCheckIcon className="h-5 w-5" />
                <span className="font-semibold">{user.roleId.role}</span>
              </div>
              <p className="text-xs text-orange-100 mt-1">User Role</p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-xs text-orange-100">User ID: {user._id}</p>
        </div>
      </div>

      {/* Financial Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Rate */}
        <div className="bg-zentyal-primary rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <ChartBarIcon className="h-8 w-8" />
            </div>
          </div>
          <p className="text-sm text-orange-100 mb-1">Rate</p>
          <p className="text-3xl font-bold">
            ₱{user.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Cash Receivable */}
        <div className="bg-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <BanknotesIcon className="h-8 w-8" />
            </div>
          </div>
          <p className="text-sm text-green-100 mb-1">Cash Receivable</p>
          <p className="text-3xl font-bold">
            ₱
            {user.cashReceivable.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>

        {/* Capital Contribution */}
        <div className="bg-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <CurrencyDollarIcon className="h-8 w-8" />
            </div>
          </div>
          <p className="text-sm text-orange-100 mb-1">Capital Contribution</p>
          <p className="text-3xl font-bold">
            ₱
            {user.capitalContribution.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>

        {/* Profit Earned */}
        <div className="bg-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <TrophyIcon className="h-8 w-8" />
            </div>
          </div>
          <p className="text-sm text-purple-100 mb-1">Profit Earned</p>
          <p className="text-3xl font-bold">
            ₱
            {user.profitEarned.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* Role Information Card */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShieldCheckIcon className="h-6 w-6 text-zentyal-primary" />
            Role Information
          </h3>
          <button
            onClick={() => router.push(`/admin/role/${user.roleId._id}`)}
            className="px-4 py-2 bg-zentyal-primary text-white rounded-lg hover:bg-orange-600 transition-colors text-sm flex items-center gap-2"
          >
            <UserIcon className="h-4 w-4" />
            <span className="hidden sm:inline">View Role Details</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Role Name</p>
            <p className="font-semibold text-gray-900">{user.roleId.role}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Role ID</p>
            <p className="text-sm text-gray-500 font-mono">{user.roleId._id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Role Status</p>
            <StatusBadge status={user.roleId.status} />
          </div>
        </div>
      </div>

      {/* Status & Timeline Card */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ClockIcon className="h-6 w-6 text-zentyal-primary" />
          Timeline & Audit Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Created Info */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm font-semibold text-green-800 mb-2">Created</p>
            <p className="text-sm text-gray-700 mb-1">
              {new Date(user.createdAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            {user.createdBy && (
              <p className="text-xs text-gray-600">
                By: {user.createdBy.firstName} {user.createdBy.lastName}
                <span className="text-gray-500"> ({user.createdBy.email})</span>
              </p>
            )}
          </div>

          {/* Updated Info */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <p className="text-sm font-semibold text-orange-800 mb-2">
              Last Updated
            </p>
            <p className="text-sm text-gray-700 mb-1">
              {new Date(user.updatedAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
            {user.updatedBy && (
              <p className="text-xs text-gray-600">
                By: {user.updatedBy.firstName} {user.updatedBy.lastName}
                <span className="text-gray-500"> ({user.updatedBy.email})</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Deletion Information (Conditional) */}
      {user.deletedAt && (
        <div className="bg-red-50 rounded-xl shadow-md p-6 border-2 border-red-300">
          <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
            <TrashIcon className="h-6 w-6 text-red-600" />
            Deletion Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-red-800 mb-2">
                Deleted At
              </p>
              <p className="text-sm text-gray-700 mb-1">
                {new Date(user.deletedAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              {user.deletedBy && (
                <p className="text-xs text-gray-600">
                  By: {user.deletedBy.firstName} {user.deletedBy.lastName}
                  <span className="text-gray-500">
                    {" "}
                    ({user.deletedBy.email})
                  </span>
                </p>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800 mb-2">Reason</p>
              <p className="text-sm text-gray-700">
                {user.deletedReason || "No reason provided"}
              </p>
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

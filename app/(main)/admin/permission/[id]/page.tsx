"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageAccess } from "@/hooks/usePageAccess";
import PageNotFound from "@/components/PageNotFound";
import { LoadingSpinner, StatusBadge } from "@/components/CRUDComponents";

interface Permission {
  _id: string;
  permission: string;
  status: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletedReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function PermissionDetailPage() {
  const { loading: pageLoading, accessDenied } = usePageAccess();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [permission, setPermission] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermission = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/admin/permission");
        if (!res.ok) throw new Error("Failed to fetch permissions");
        const data = await res.json();
        const foundPermission = data.find((p: Permission) => p._id === id);
        if (!foundPermission) throw new Error("Permission not found");
        setPermission(foundPermission);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch permission",
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPermission();
    }
  }, [id]);

  if (pageLoading) return <LoadingSpinner />;
  if (accessDenied) return <PageNotFound />;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-zentyal-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading permission details...</p>
        </div>
      </div>
    );
  }

  if (error || !permission) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg
              className="w-12 h-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-red-900">Error</h1>
              <p className="text-red-700 mt-1">
                {error || "Permission not found"}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/admin/permission")}
            className="mt-4 px-6 py-3 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark 
                     transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Permissions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 md:mt-0">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/permission")}
          className="p-2 text-gray-600 hover:text-zentyal-primary hover:bg-gray-100 rounded-lg transition-all"
          title="Back to Permissions"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Permission Details
          </h1>
          <p className="text-gray-600 mt-1">
            View complete permission information
          </p>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
        <div className="bg-zentyal-primary p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">
                {permission.permission}
              </h2>
              <p className="text-white/80 text-sm">Permission Name</p>
            </div>
            <StatusBadge status={permission.status} />
          </div>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* Permission ID */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Permission ID
            </label>
            <p className="text-gray-900 font-mono text-sm bg-gray-50 p-3 rounded-lg break-all">
              {permission._id}
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Current Status
            </label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <StatusBadge status={permission.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Timestamps Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-zentyal-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Timeline Information
          </h3>
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* Created At */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2">
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Created At
            </label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
              {permission.createdAt
                ? new Date(permission.createdAt).toLocaleString("en-US", {
                    dateStyle: "full",
                    timeStyle: "medium",
                  })
                : "N/A"}
            </p>
          </div>

          {/* Updated At */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2">
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Last Updated
            </label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
              {permission.updatedAt
                ? new Date(permission.updatedAt).toLocaleString("en-US", {
                    dateStyle: "full",
                    timeStyle: "medium",
                  })
                : "N/A"}
            </p>
          </div>

          {/* Created By */}
          {permission.createdBy && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Created By
              </label>
              <p className="text-gray-900 font-mono text-sm bg-gray-50 p-3 rounded-lg break-all">
                {permission.createdBy}
              </p>
            </div>
          )}

          {/* Updated By */}
          {permission.updatedBy && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Updated By
              </label>
              <p className="text-gray-900 font-mono text-sm bg-gray-50 p-3 rounded-lg break-all">
                {permission.updatedBy}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Deletion Info Card (if deleted) */}
      {permission.deletedAt && (
        <div className="bg-red-50 rounded-xl shadow-lg border border-red-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-red-200 bg-red-100">
            <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Deletion Information
            </h3>
          </div>
          <div className="p-6 grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-red-600 uppercase tracking-wide">
                Deleted At
              </label>
              <p className="text-red-900 bg-white p-3 rounded-lg">
                {new Date(permission.deletedAt).toLocaleString("en-US", {
                  dateStyle: "full",
                  timeStyle: "medium",
                })}
              </p>
            </div>

            {permission.deletedBy && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-red-600 uppercase tracking-wide">
                  Deleted By
                </label>
                <p className="text-red-900 font-mono text-sm bg-white p-3 rounded-lg break-all">
                  {permission.deletedBy}
                </p>
              </div>
            )}

            {permission.deletedReason && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-red-600 uppercase tracking-wide">
                  Deletion Reason
                </label>
                <p className="text-red-900 bg-white p-3 rounded-lg">
                  {permission.deletedReason}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => router.push("/admin/permission")}
          className="w-full sm:w-auto px-8 py-3 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark 
                   transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to List
        </button>
      </div>
    </div>
  );
}

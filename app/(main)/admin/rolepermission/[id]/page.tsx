"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageAccess } from "@/hooks/usePageAccess";
import PageNotFound from "@/components/PageNotFound";
import { LoadingSpinner, StatusBadge } from "@/components/CRUDComponents";

interface RolePermission {
  _id: string;
  roleId: {
    _id: string;
    role: string;
    status: string;
  };
  pageId?: {
    _id: string;
    page: string;
    path: string;
    status: string;
  };
  permissionId: {
    _id: string;
    permission: string;
    status: string;
  };
  status: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletedReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function RolePermissionDetailPage() {
  const { loading: pageLoading, accessDenied } = usePageAccess();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [assignment, setAssignment] = useState<RolePermission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/admin/rolepermission");
        if (!res.ok) throw new Error("Failed to fetch assignments");
        const data = await res.json();
        const foundAssignment = data.find((a: RolePermission) => a._id === id);
        if (!foundAssignment) throw new Error("Assignment not found");
        setAssignment(foundAssignment);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch assignment",
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAssignment();
    }
  }, [id]);

  if (pageLoading) return <LoadingSpinner />;
  if (accessDenied) return <PageNotFound />;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-zentyal-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignment details...</p>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
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
                {error || "Assignment not found"}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/admin/rolepermission")}
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
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 md:mt-0">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/rolepermission")}
          className="p-2 text-gray-600 hover:text-zentyal-primary hover:bg-gray-100 rounded-lg transition-all"
          title="Back to Assignments"
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
            Assignment Details
          </h1>
          <p className="text-gray-600 mt-1">
            Role-Permission Assignment Information
          </p>
        </div>
      </div>

      {/* Assignment ID Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide block mb-2">
          Assignment ID
        </label>
        <p className="text-gray-900 font-mono text-sm bg-gray-50 p-3 rounded-lg break-all">
          {assignment._id}
        </p>
      </div>

      {/* Main Info Cards */}
      <div
        className={`grid gap-6 mb-6 ${assignment.pageId ? "md:grid-cols-3" : "md:grid-cols-2"}`}
      >
        {/* Role Card */}
        <div className="bg-orange-50 rounded-xl shadow-lg border border-orange-200 overflow-hidden">
          <div className="bg-zentyal-primary px-6 py-3">
            <h3 className="text-white font-bold flex items-center gap-2">
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Role
            </h3>
          </div>
          <div className="p-6">
            <p className="text-2xl font-bold text-gray-900 mb-3">
              {assignment.roleId.role}
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-600">
                <span className="font-semibold">ID:</span>{" "}
                <code className="bg-white px-2 py-0.5 rounded text-xs">
                  {assignment.roleId._id}
                </code>
              </p>
              <div>
                <StatusBadge status={assignment.roleId.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Page Card */}
        {assignment.pageId && (
          <div className="bg-orange-50 rounded-xl shadow-lg border border-orange-200 overflow-hidden">
            <div className="bg-orange-600 px-6 py-3">
              <h3 className="text-white font-bold flex items-center gap-2">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Page
              </h3>
            </div>
            <div className="p-6">
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {assignment.pageId.page}
              </p>
              <div className="space-y-2">
                <p className="text-sm">
                  <code className="bg-white px-2 py-1 rounded text-orange-600 font-semibold">
                    {assignment.pageId.path}
                  </code>
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">ID:</span>{" "}
                  <code className="bg-white px-2 py-0.5 rounded text-xs">
                    {assignment.pageId._id}
                  </code>
                </p>
                <div>
                  <StatusBadge status={assignment.pageId.status} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Permission Card */}
        <div className="bg-green-50 rounded-xl shadow-lg border border-green-200 overflow-hidden">
          <div className="bg-green-600 px-6 py-3">
            <h3 className="text-white font-bold flex items-center gap-2">
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Permission
            </h3>
          </div>
          <div className="p-6">
            <p className="text-2xl font-bold text-gray-900 mb-3">
              {assignment.permissionId.permission}
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-600">
                <span className="font-semibold">ID:</span>{" "}
                <code className="bg-white px-2 py-0.5 rounded text-xs">
                  {assignment.permissionId._id}
                </code>
              </p>
              <div>
                <StatusBadge status={assignment.permissionId.status} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status & Timestamps Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">
            Assignment Status & Timeline
          </h3>
        </div>
        <div className="p-6 grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Assignment Status
            </label>
            <div>
              <StatusBadge status={assignment.status} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Created At
            </label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg text-sm">
              {assignment.createdAt
                ? new Date(assignment.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "N/A"}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Last Updated
            </label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg text-sm">
              {assignment.updatedAt
                ? new Date(assignment.updatedAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "N/A"}
            </p>
          </div>

          {assignment.createdBy && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Created By
              </label>
              <p className="text-gray-900 font-mono text-xs bg-gray-50 p-3 rounded-lg break-all">
                {assignment.createdBy}
              </p>
            </div>
          )}

          {assignment.updatedBy && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Updated By
              </label>
              <p className="text-gray-900 font-mono text-xs bg-gray-50 p-3 rounded-lg break-all">
                {assignment.updatedBy}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Deletion Info Card (if deleted) */}
      {assignment.deletedAt && (
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
                {new Date(assignment.deletedAt).toLocaleString("en-US", {
                  dateStyle: "full",
                  timeStyle: "medium",
                })}
              </p>
            </div>

            {assignment.deletedBy && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-red-600 uppercase tracking-wide">
                  Deleted By
                </label>
                <p className="text-red-900 font-mono text-sm bg-white p-3 rounded-lg break-all">
                  {assignment.deletedBy}
                </p>
              </div>
            )}

            {assignment.deletedReason && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-red-600 uppercase tracking-wide">
                  Deletion Reason
                </label>
                <p className="text-red-900 bg-white p-3 rounded-lg">
                  {assignment.deletedReason}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <button
          onClick={() => router.push("/admin/rolepermission")}
          className="w-full sm:w-auto px-6 py-3 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark 
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
        <button
          onClick={() => router.push(`/admin/role/${assignment.roleId._id}`)}
          className="w-full sm:w-auto px-6 py-3 bg-zentyal-primary text-white rounded-lg hover:bg-orange-600 
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
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          View Role
        </button>
        {assignment.pageId && (
          <button
            onClick={() => router.push(`/admin/page/${assignment.pageId!._id}`)}
            className="w-full sm:w-auto px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            View Page
          </button>
        )}
        <button
          onClick={() =>
            router.push(`/admin/permission/${assignment.permissionId._id}`)
          }
          className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 
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
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          View Permission
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageAccess } from "@/hooks/usePageAccess";
import { useAuth } from "@/context/AuthContext";
import PageNotFound from "@/components/PageNotFound";
import { LoadingSpinner, StatusBadge } from "@/components/CRUDComponents";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import LoadingModal from "@/components/LoadingModal";
import DataTable from "@/components/DataTable";

interface PageModel {
  _id: string;
  page: string;
  path: string;
  parentId?: string | null;
  order: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function PageManagement() {
  const { loading: pageLoading, accessDenied } = usePageAccess();
  const { hasPermission } = useAuth();
  const router = useRouter();
  const [pages, setPages] = useState<PageModel[]>([]);
  const [formData, setFormData] = useState({
    page: "",
    path: "",
    parentId: "",
    order: 0,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const canAdd = hasPermission("/admin/page", "Add");
  const canEdit = hasPermission("/admin/page", "Edit");
  const canDelete = hasPermission("/admin/page", "Delete");

  useEffect(() => {
    fetchPages();
  }, []);

  if (pageLoading) return <LoadingSpinner />;
  if (accessDenied) return <PageNotFound />;

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/page");
      if (!res.ok) throw new Error("Failed to fetch pages");
      const data = await res.json();
      setPages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch pages");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowLoadingModal(true);

    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { _id: editingId, ...formData } : formData;

      const res = await fetch("/api/admin/page", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Operation failed");
      }

      setFormData({ page: "", path: "", parentId: "", order: 0 });
      setEditingId(null);
      setShowFormModal(false);
      await fetchPages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setShowLoadingModal(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTarget(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (reason?: string) => {
    if (!deleteTarget || !reason) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/page?_id=${deleteTarget}&deletedReason=${encodeURIComponent(reason)}`,
        { method: "DELETE" },
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete page");
      }
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchPages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete page");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pageItem: PageModel) => {
    setFormData({
      page: pageItem.page,
      path: pageItem.path,
      parentId: pageItem.parentId || "",
      order: pageItem.order,
    });
    setEditingId(pageItem._id);
    setShowFormModal(true);
    setError(null);
  };

  const resetForm = () => {
    setFormData({ page: "", path: "", parentId: "", order: 0 });
    setEditingId(null);
    setError(null);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    resetForm();
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 mt-10 md:mt-0">
            Page
          </h1>
          <p className="text-gray-600">Manage navigation pages and routes</p>
        </div>
        {canAdd && (
          <button
            onClick={() => {
              resetForm();
              setShowFormModal(true);
            }}
            className="px-3 sm:px-6 py-3 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark 
                     transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105
                     flex items-center space-x-2"
            title="Add New Page"
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
            <span className="hidden sm:inline">Add New Page</span>
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Pages Table with DataTable Component */}
      <DataTable
        data={pages.sort((a, b) => a.order - b.order)}
        columns={[
          {
            key: "page",
            label: "Page",
            sortable: true,
            render: (pageItem: PageModel) => (
              <div className="flex items-center justify-end md:justify-start">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zentyal-primary/10 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-zentyal-primary"
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
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {pageItem.page}
                </span>
              </div>
            ),
            exportValue: (pageItem: PageModel) => pageItem.page,
          },
          {
            key: "path",
            label: "Path",
            sortable: true,
            render: (pageItem: PageModel) => (
              <code className="text-xs bg-gray-100 px-2 py-1 rounded text-zentyal-primary">
                {pageItem.path}
              </code>
            ),
            exportValue: (pageItem: PageModel) => pageItem.path,
          },
          {
            key: "order",
            label: "Order",
            sortable: true,
            render: (pageItem: PageModel) => (
              <div className="flex justify-end md:justify-center">
                <span className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-zentyal-primary/10 text-zentyal-primary font-bold rounded-full text-xs sm:text-sm">
                  {pageItem.order}
                </span>
              </div>
            ),
            exportValue: (pageItem: PageModel) => pageItem.order.toString(),
          },
          {
            key: "status",
            label: "Status",
            sortable: true,
            render: (pageItem: PageModel) => (
              <div className="flex justify-end md:justify-center">
                <StatusBadge status={pageItem.status} />
              </div>
            ),
            exportValue: (pageItem: PageModel) => pageItem.status,
          },
          {
            key: "actions",
            label: "Actions",
            sortable: false,
            searchable: false,
            render: (pageItem: PageModel) => (
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <button
                  onClick={() => router.push(`/admin/page/${pageItem._id}`)}
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
                {canEdit && (
                  <button
                    onClick={() => handleEdit(pageItem)}
                    className="p-1.5 sm:p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Edit Page"
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
                {canDelete && (
                  <button
                    onClick={() => handleDeleteClick(pageItem._id)}
                    className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Page"
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
              </div>
            ),
          },
        ]}
        loading={loading}
        emptyMessage="No pages found"
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        }
        exportFileName="pages"
        searchPlaceholder="Search pages..."
        itemsPerPage={10}
      />

      {/* Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={handleCloseFormModal}
        title={editingId ? "Edit Page" : "Create New Page"}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Page Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.page}
                onChange={(e) =>
                  setFormData({ ...formData, page: e.target.value })
                }
                required
                placeholder="e.g., Dashboard, User Management"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
                autoFocus
              />
            </div>

            {/* Path */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Path <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.path}
                onChange={(e) =>
                  setFormData({ ...formData, path: e.target.value })
                }
                required
                placeholder="/admin/dashboard"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Parent Page */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Page (Optional)
              </label>
              <select
                value={formData.parentId}
                onChange={(e) =>
                  setFormData({ ...formData, parentId: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              >
                <option value="">None (Top Level)</option>
                {pages.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.page} ({p.path})
                  </option>
                ))}
              </select>
            </div>

            {/* Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Order <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order: parseInt(e.target.value) || 0,
                  })
                }
                required
                placeholder="0"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                         focus:ring-zentyal-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
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
              className="px-6 py-2.5 bg-zentyal-primary text-white rounded-lg hover:bg-zentyal-dark 
                       transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              {editingId ? "Update Page" : "Create Page"}
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
        title="Delete Page"
        message="Are you sure you want to delete this page? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        requireReason={true}
        isLoading={loading}
      />

      {/* Loading Modal */}
      <LoadingModal
        isOpen={showLoadingModal}
        message={editingId ? "Updating page..." : "Creating page..."}
      />
    </div>
  );
}

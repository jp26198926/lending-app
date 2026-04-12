"use client";

import { useState, useMemo, useRef } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  PrinterIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  exportValue?: (item: T) => string | number;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  itemsPerPage?: number;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  exportFileName?: string;
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
}

export default function DataTable<T extends { _id?: string; id?: string }>({
  data,
  columns,
  itemsPerPage = 10,
  loading = false,
  emptyMessage = "No data found",
  emptyIcon,
  exportFileName = "export",
  searchPlaceholder = "Search...",
  onRowClick,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<
    Record<string, string>
  >({});
  const printRef = useRef<HTMLDivElement>(null);

  // Filter data based on search term and advanced filters
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply basic search
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        return columns.some((column) => {
          if (column.searchable === false) return false;

          const value = (item as any)[column.key];
          if (value === null || value === undefined) return false;

          // Handle nested objects
          if (typeof value === "object" && !Array.isArray(value)) {
            return JSON.stringify(value)
              .toLowerCase()
              .includes(searchTerm.toLowerCase());
          }

          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }

    // Apply advanced filters
    if (Object.keys(advancedFilters).length > 0) {
      filtered = filtered.filter((item) => {
        return Object.entries(advancedFilters).every(([key, filterValue]) => {
          if (!filterValue) return true;

          const itemValue = (item as any)[key];
          if (itemValue === null || itemValue === undefined) return false;

          // Handle nested objects
          if (typeof itemValue === "object" && !Array.isArray(itemValue)) {
            return JSON.stringify(itemValue)
              .toLowerCase()
              .includes(filterValue.toLowerCase());
          }

          return String(itemValue)
            .toLowerCase()
            .includes(filterValue.toLowerCase());
        });
      });
    }

    return filtered;
  }, [data, searchTerm, advancedFilters, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      // Handle nested objects
      const aVal =
        typeof aValue === "object" && aValue !== null
          ? JSON.stringify(aValue)
          : aValue;
      const bVal =
        typeof bValue === "object" && bValue !== null
          ? JSON.stringify(bValue)
          : bValue;

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSort = (key: string) => {
    const column = columns.find((col) => col.key === key);
    if (column?.sortable === false) return;

    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === "asc" ? { key, direction: "desc" } : null;
      }
      return { key, direction: "asc" };
    });
  };

  const handleExport = () => {
    // Prepare CSV data
    const headers = columns.map((col) => col.label).join(",");
    const rows = sortedData.map((item) => {
      return columns
        .map((col) => {
          const value = col.exportValue
            ? col.exportValue(item)
            : (item as any)[col.key];
          // Escape commas and quotes
          const stringValue = String(
            typeof value === "object" ? JSON.stringify(value) : value || "",
          );
          return `"${stringValue.replace(/"/g, '""')}"`;
        })
        .join(",");
    });

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportFileName}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printContent = document.createElement("div");
    printContent.innerHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Report - ${exportFileName}</title>
          <style>
            @media print {
              @page { margin: 1cm; size: portrait; }
              body { margin: 0; padding: 0; }
            }
            * { box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #1f2937;
              line-height: 1.5;
            }
            .print-container {
              max-width: 100%;
              padding: 20px;
            }
            .header {
              border-bottom: 3px solid #ff6f00;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .company-info h1 {
              margin: 0;
              font-size: 28px;
              color: #ff6f00;
              font-weight: bold;
            }
            .company-info p {
              margin: 5px 0;
              color: #6b7280;
              font-size: 14px;
            }
            .report-meta {
              text-align: right;
              font-size: 12px;
              color: #6b7280;
            }
            .report-meta .date {
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 4px;
            }
            .report-title {
              font-size: 20px;
              font-weight: 600;
              color: #111827;
              margin-bottom: 20px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .summary-stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-bottom: 30px;
            }
            .stat-card {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #a4c639;
            }
            .stat-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 5px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #ff6f00;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 13px;
            }
            thead {
              background: #ff6f00;
              color: white;
            }
            th {
              padding: 12px 10px;
              text-align: left;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.5px;
            }
            tbody tr {
              border-bottom: 1px solid #e5e7eb;
            }
            tbody tr:nth-child(even) {
              background-color: #f9fafb;
            }
            tbody tr:hover {
              background-color: #f3f4f6;
            }
            td {
              padding: 10px;
              color: #374151;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              font-size: 11px;
              color: #6b7280;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="header">
              <div class="company-info">
                <h1>Company Name</h1>
                <p>Professional Business Solutions</p>
                <p>contact@company.com | +1 (555) 123-4567</p>
              </div>
              <div class="report-meta">
                <div class="date">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
                <div>Generated: ${new Date().toLocaleTimeString()}</div>
              </div>
            </div>
            
            <div class="report-title">${exportFileName.replace(/-/g, " ")} Report</div>
            
            <div class="summary-stats">
              <div class="stat-card">
                <div class="stat-label">Total Records</div>
                <div class="stat-value">${sortedData.length}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Current Page</div>
                <div class="stat-value">${currentPage} of ${totalPages}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Records Shown</div>
                <div class="stat-value">${currentData.length}</div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  ${columns
                    .filter((col) => col.key !== "actions")
                    .map((col) => `<th>${col.label}</th>`)
                    .join("")}
                </tr>
              </thead>
              <tbody>
                ${sortedData
                  .map(
                    (item) => `
                  <tr>
                    ${columns
                      .filter((col) => col.key !== "actions")
                      .map((col) => {
                        const value = col.exportValue
                          ? col.exportValue(item)
                          : (item as any)[col.key];
                        return `<td>${typeof value === "object" ? JSON.stringify(value) : value || "-"}</td>`;
                      })
                      .join("")}
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
            
            <div class="footer">
              <p>This is a computer-generated document. No signature is required.</p>
              <p>&copy; ${new Date().getFullYear()} Company Name. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleApplyAdvancedFilters = () => {
    setShowAdvancedSearch(false);
    setCurrentPage(1);
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({});
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-12 text-center">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zentyal-primary"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header with Search and Actions */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg 
                       focus:ring-2 focus:ring-zentyal-primary focus:border-transparent 
                       text-sm transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Toggle Filters"
            >
              <FunnelIcon className="h-5 w-5" />
            </button>

            {/* Advanced Search Button */}
            <button
              onClick={() => setShowAdvancedSearch(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-zentyal-primary text-white 
                       rounded-lg hover:bg-zentyal-dark transition-all text-sm font-medium"
              title="Advanced Search"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Advanced</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              disabled={sortedData.length === 0}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-700 text-white 
                       rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 
                       disabled:cursor-not-allowed text-sm font-medium"
              title="Print Report"
            >
              <PrinterIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={sortedData.length === 0}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-zentyal-accent text-zentyal-dark 
                       rounded-lg hover:bg-zentyal-accent/80 transition-all disabled:opacity-50 
                       disabled:cursor-not-allowed text-sm font-medium"
              title="Export to CSV"
            >
              <ArrowDownTrayIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Records Count */}
            <div className="hidden sm:flex items-center text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200">
              <span className="font-medium text-zentyal-primary">
                {sortedData.length}
              </span>
              <span className="ml-1">
                {sortedData.length === 1 ? "record" : "records"}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Records Count */}
        <div className="sm:hidden mt-2 text-sm text-gray-600">
          <span className="font-medium text-zentyal-primary">
            {sortedData.length}
          </span>
          <span className="ml-1">
            {sortedData.length === 1 ? "record" : "records"}
          </span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zentyal-dark text-white">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() =>
                    column.sortable !== false && handleSort(column.key)
                  }
                  className={`px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold uppercase tracking-wider
                    ${column.sortable !== false ? "cursor-pointer hover:bg-zentyal-primary/20 select-none" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable !== false &&
                      sortConfig?.key === column.key && (
                        <span className="text-zentyal-accent">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyIcon || (
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
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  )}
                  <p className="text-lg font-medium">{emptyMessage}</p>
                  {searchTerm && (
                    <p className="text-sm mt-1">
                      Try adjusting your search criteria
                    </p>
                  )}
                </td>
              </tr>
            ) : (
              currentData.map((item, index) => {
                const itemId = item._id || item.id || index;
                return (
                  <tr
                    key={itemId}
                    onClick={() => onRowClick?.(item)}
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    } ${onRowClick ? "cursor-pointer" : ""}`}
                  >
                    {columns.map((column) => (
                      <td
                        key={`${itemId}-${column.key}`}
                        className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                      >
                        {column.render
                          ? column.render(item)
                          : String((item as any)[column.key] || "")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {currentData.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            {emptyIcon || (
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
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            )}
            <p className="text-lg font-medium">{emptyMessage}</p>
            {searchTerm && (
              <p className="text-sm mt-1">Try adjusting your search criteria</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {currentData.map((item, index) => {
              const itemId = item._id || item.id || index;
              return (
                <div
                  key={itemId}
                  onClick={() => onRowClick?.(item)}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  <div className="space-y-3">
                    {columns.map((column) => {
                      // Skip rendering if it's an actions column (determined by key)
                      const isActionsColumn = column.key === "actions";

                      return (
                        <div
                          key={`${itemId}-${column.key}`}
                          className={isActionsColumn ? "" : ""}
                        >
                          {isActionsColumn ? (
                            // Render actions column without label
                            <div className="flex justify-end pt-2 border-t border-gray-100">
                              {column.render
                                ? column.render(item)
                                : String((item as any)[column.key] || "")}
                            </div>
                          ) : (
                            // Render regular columns with label
                            <div className="flex justify-between items-start gap-4">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-25">
                                {column.label}
                              </span>
                              <div className="flex-1 text-right text-sm text-gray-900">
                                {column.render
                                  ? column.render(item)
                                  : String((item as any)[column.key] || "")}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Page Info */}
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-medium text-gray-900">
                {startIndex + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-gray-900">
                {Math.min(endIndex, sortedData.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-900">
                {sortedData.length}
              </span>{" "}
              results
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-1 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                         rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span className="hidden sm:inline">First</span>
                <span className="sm:hidden">««</span>
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-700 bg-white border border-gray-300 rounded-lg 
                         hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2 sm:px-3 py-1 sm:py-2 text-sm font-medium rounded-lg transition-all
                        ${
                          currentPage === pageNum
                            ? "bg-zentyal-primary text-white"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 text-gray-700 bg-white border border-gray-300 rounded-lg 
                         hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-1 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                         rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span className="hidden sm:inline">Last</span>
                <span className="sm:hidden">»»</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Advanced Search
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Filter by specific columns
                </p>
              </div>
              <button
                onClick={() => setShowAdvancedSearch(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                         rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {columns
                  .filter(
                    (col) => col.key !== "actions" && col.searchable !== false,
                  )
                  .map((column) => (
                    <div key={column.key}>
                      <label
                        htmlFor={`filter-${column.key}`}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        {column.label}
                      </label>
                      <input
                        type="text"
                        id={`filter-${column.key}`}
                        value={advancedFilters[column.key] || ""}
                        onChange={(e) =>
                          setAdvancedFilters({
                            ...advancedFilters,
                            [column.key]: e.target.value,
                          })
                        }
                        placeholder={`Search ${column.label.toLowerCase()}...`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-zentyal-primary 
                                 focus:border-transparent text-sm"
                      />
                    </div>
                  ))}
              </div>

              {/* Active Filters Summary */}
              {Object.keys(advancedFilters).filter(
                (key) => advancedFilters[key],
              ).length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Active Filters (
                    {
                      Object.keys(advancedFilters).filter(
                        (key) => advancedFilters[key],
                      ).length
                    }
                    )
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(advancedFilters)
                      .filter(([_, value]) => value)
                      .map(([key, value]) => {
                        const column = columns.find((col) => col.key === key);
                        return (
                          <span
                            key={key}
                            className="inline-flex items-center gap-1 px-3 py-1 
                                     bg-white border border-blue-200 rounded-full text-sm"
                          >
                            <span className="font-medium text-blue-900">
                              {column?.label}:
                            </span>
                            <span className="text-blue-700">{value}</span>
                            <button
                              onClick={() => {
                                const newFilters = { ...advancedFilters };
                                delete newFilters[key];
                                setAdvancedFilters(newFilters);
                              }}
                              className="ml-1 text-blue-500 hover:text-blue-700"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleClearAdvancedFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border 
                         border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowAdvancedSearch(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border 
                         border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyAdvancedFilters}
                className="px-4 py-2 text-sm font-medium text-white bg-zentyal-primary 
                         rounded-lg hover:bg-zentyal-dark transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

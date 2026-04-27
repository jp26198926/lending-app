"use client";

import { useAuth } from "@/context/AuthContext";
import { usePageAccess } from "@/hooks/usePageAccess";
import PageNotFound from "@/components/PageNotFound";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  cashOnHand: number;
  userWithdrawableCash: number;
  totalClients: number;
  totalStaffs: number;
  activeLoans: number;
  totalOutstanding: number;
  collectionsThisMonth: number;
  overdueCycles: number;
  paymentCollections: Array<{
    _id: string;
    totalAmount: number;
    count: number;
  }>;
  loanDisbursements: Array<{
    _id: string;
    totalAmount: number;
    count: number;
  }>;
  recentActivities: Array<{
    _id: string;
    amount: number;
    datePaid: string;
    loanId: {
      loanNumber: string;
      clientId: {
        firstName: string;
        lastName: string;
      };
    };
  }>;
  loanStatusDistribution: Array<{
    _id: string;
    count: number;
  }>;
  period: string;
}

export default function Dashboard() {
  const { loading, accessDenied } = usePageAccess();
  const { hasPermission, user } = useAuth();

  // State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("daily");

  // Fetch dashboard data
  const fetchDashboardData = async (period: string) => {
    try {
      setDataLoading(true);
      const response = await fetch(`/api/admin/dashboard?period=${period}`, {
        method: "GET",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to fetch dashboard data");
        return;
      }

      setDashboardData(result.data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setDataLoading(false);
    }
  };

  // Fetch data on mount and when period changes
  useEffect(() => {
    if (!loading && !accessDenied) {
      fetchDashboardData(selectedPeriod);
    }
  }, [loading, accessDenied, selectedPeriod]);

  // Handle period change
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  // Chart colors
  const COLORS = {
    primary: "#ff6f00",
    accent: "#a4c639",
    blue: "#3b82f6",
    green: "#10b981",
    red: "#ef4444",
    purple: "#8b5cf6",
    yellow: "#f59e0b",
  };

  const PIE_COLORS = [
    COLORS.primary,
    COLORS.accent,
    COLORS.blue,
    COLORS.green,
    COLORS.purple,
  ];

  // Check permissions for this page
  const canAdd = hasPermission("/admin/dashboard", "Add");
  const canEdit = hasPermission("/admin/dashboard", "Edit");
  const canDelete = hasPermission("/admin/dashboard", "Delete");
  const canPrint = hasPermission("/admin/dashboard", "Print");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zentyal-primary"></div>
      </div>
    );
  }

  if (accessDenied) {
    return <PageNotFound />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">System overview and analytics</p>
      </div>

      {dataLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-zentyal-primary"></div>
        </div>
      ) : (
        <>
          {/* Primary Metrics - BIGGER Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Cash on Hand - BIGGER */}
            <div className="bg-linear-to-br from-zentyal-primary to-orange-600 rounded-2xl shadow-2xl p-8 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white/90 text-sm font-medium uppercase tracking-wide">
                        Cash on Hand
                      </p>
                      <p className="text-white/70 text-xs mt-0.5">
                        Total available funds
                      </p>
                    </div>
                  </div>
                  <h2 className="text-5xl font-bold mt-4 font-mono">
                    {dashboardData?.cashOnHand.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </h2>
                  <div className="flex items-center mt-3 space-x-2">
                    <svg
                      className="w-5 h-5 text-white/80"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-white/80 text-sm">
                      System cash balance
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Withdrawable Cash - BIGGER */}
            <div className="bg-linear-to-br from-zentyal-accent to-green-600 rounded-2xl shadow-2xl p-8 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white/90 text-sm font-medium uppercase tracking-wide">
                        Your Withdrawable Cash
                      </p>
                      <p className="text-white/70 text-xs mt-0.5">
                        Available for withdrawal
                      </p>
                    </div>
                  </div>
                  <h2 className="text-5xl font-bold mt-4 font-mono">
                    {dashboardData?.userWithdrawableCash.toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </h2>
                  <div className="flex items-center mt-3 space-x-2">
                    <svg
                      className="w-5 h-5 text-white/80"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="text-white/80 text-sm">
                      {user?.firstName} {user?.lastName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Metrics - 4 Smaller Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Total Clients */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Total Clients
                  </p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-1">
                    {dashboardData?.totalClients || 0}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Active clients</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Staffs */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Total Staffs
                  </p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-1">
                    {dashboardData?.totalStaffs || 0}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Active users</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-500"
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
                </div>
              </div>
            </div>

            {/* Active Loans */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-zentyal-primary hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Active Loans
                  </p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-1">
                    {dashboardData?.activeLoans || 0}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Current loans</p>
                </div>
                <div className="w-12 h-12 bg-zentyal-primary/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-zentyal-primary"
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
              </div>
            </div>

            {/* Overdue Payments */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Overdue Cycles
                  </p>
                  <h3 className="text-3xl font-bold text-gray-800 mt-1">
                    {dashboardData?.overdueCycles || 0}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Past due date</p>
                </div>
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-500"
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
                </div>
              </div>
            </div>
          </div>

          {/* Additional Financial Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {/* Total Outstanding */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-600 text-sm font-medium mb-2">
                    Total Outstanding Amount
                  </p>
                  <h3 className="text-4xl font-bold text-gray-800 font-mono">
                    {dashboardData?.totalOutstanding.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2">
                    Sum of all active cycle balances
                  </p>
                </div>
                <div className="w-14 h-14 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-yellow-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Collections This Month */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-600 text-sm font-medium mb-2">
                    Collections This Month
                  </p>
                  <h3 className="text-4xl font-bold text-gray-800 font-mono">
                    {dashboardData?.collectionsThisMonth.toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2">
                    Total payments received
                  </p>
                </div>
                <div className="w-14 h-14 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Period Filter */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-bold text-gray-800">
                Analytics Dashboard
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 mr-2">Period:</span>
                <button
                  onClick={() => handlePeriodChange("daily")}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === "daily"
                      ? "bg-zentyal-primary text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span className="sm:hidden">D</span>
                  <span className="hidden sm:inline">Daily</span>
                </button>
                <button
                  onClick={() => handlePeriodChange("weekly")}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === "weekly"
                      ? "bg-zentyal-primary text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span className="sm:hidden">W</span>
                  <span className="hidden sm:inline">Weekly</span>
                </button>
                <button
                  onClick={() => handlePeriodChange("fortnightly")}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === "fortnightly"
                      ? "bg-zentyal-primary text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span className="sm:hidden">F</span>
                  <span className="hidden sm:inline">Fortnightly</span>
                </button>
                <button
                  onClick={() => handlePeriodChange("monthly")}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPeriod === "monthly"
                      ? "bg-zentyal-primary text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span className="sm:hidden">M</span>
                  <span className="hidden sm:inline">Monthly</span>
                </button>
              </div>
            </div>
          </div>

          {/* Analytics Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Payment Collections Chart */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Payment Collections Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={dashboardData?.paymentCollections || []}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => {
                      if (typeof value === "number") {
                        return value.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        });
                      }
                      return String(value || 0);
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalAmount"
                    stroke={COLORS.primary}
                    strokeWidth={3}
                    name="Amount"
                    dot={{ fill: COLORS.primary, r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS.primary }}
                  ></div>
                  <span className="text-gray-600">Payment Amount</span>
                </div>
              </div>
            </div>

            {/* Loan Disbursements Chart */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Loan Disbursements Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={dashboardData?.loanDisbursements || []}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => {
                      if (typeof value === "number") {
                        return value.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        });
                      }
                      return String(value || 0);
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="totalAmount"
                    fill={COLORS.accent}
                    name="Amount"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS.accent }}
                  ></div>
                  <span className="text-gray-600">Disbursement Amount</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Loan Status Distribution */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Loan Status Distribution
              </h3>
              {dashboardData?.loanStatusDistribution &&
              dashboardData.loanStatusDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardData.loanStatusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({
                          cx,
                          cy,
                          midAngle,
                          innerRadius,
                          outerRadius,
                          percent,
                        }) => {
                          if (
                            !cx ||
                            !cy ||
                            midAngle === undefined ||
                            !innerRadius ||
                            !outerRadius ||
                            percent === undefined
                          ) {
                            return null;
                          }
                          const radius =
                            innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x =
                            cx + radius * Math.cos((-midAngle * Math.PI) / 180);
                          const y =
                            cy + radius * Math.sin((-midAngle * Math.PI) / 180);
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="white"
                              textAnchor={x > cx ? "start" : "end"}
                              dominantBaseline="central"
                              className="text-sm font-bold"
                            >
                              {`${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {dashboardData.loanStatusDistribution.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {dashboardData.loanStatusDistribution.map((item, index) => (
                      <div key={item._id} className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{
                            backgroundColor:
                              PIE_COLORS[index % PIE_COLORS.length],
                          }}
                        ></div>
                        <span className="text-sm text-gray-700">
                          {item._id}: <strong>{item.count}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  <div className="text-center">
                    <svg
                      className="w-16 h-16 mx-auto mb-3 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <p>No loan data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Recent Payment Activities
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData?.recentActivities &&
                dashboardData.recentActivities.length > 0 ? (
                  dashboardData.recentActivities.map((activity) => (
                    <div
                      key={activity._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zentyal-primary/10 rounded-full flex items-center justify-center">
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
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {activity.loanId?.clientId?.firstName}{" "}
                            {activity.loanId?.clientId?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Loan: {activity.loanId?.loanNumber}
                          </p>
                          <p className="text-xs text-gray-400">
                            {
                              new Date(activity.datePaid)
                                .toISOString()
                                .split("T")[0]
                            }
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600 font-mono">
                          {activity.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400">
                    <div className="text-center">
                      <svg
                        className="w-16 h-16 mx-auto mb-3 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <p>No recent activities</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

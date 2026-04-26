import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { withAuth } from "@/lib/apiAuth";
import User from "@/models/User";
import Client from "@/models/Client";
import Loan from "@/models/Loan";
import Cycle from "@/models/Cycle";
import Payment from "@/models/Payment";
import Settings from "@/models/Settings";

const PAGE_PATH = "/admin/dashboard";

export async function GET(request: NextRequest) {
  // Security check
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await connectDB();

    // Get query parameters for analytics filter
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "daily"; // daily, weekly, fortnightly, monthly

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "daily":
        startDate.setDate(now.getDate() - 7); // Last 7 days
        break;
      case "weekly":
        startDate.setDate(now.getDate() - 28); // Last 4 weeks
        break;
      case "fortnightly":
        startDate.setDate(now.getDate() - 56); // Last 4 fortnights (8 weeks)
        break;
      case "monthly":
        startDate.setMonth(now.getMonth() - 6); // Last 6 months
        break;
    }

    // 1. Get Cash on Hand from Settings
    const settings = await Settings.findOne({ status: { $ne: "DELETED" } });
    const cashOnHand = settings?.cashOnHand || 0;

    // 2. Get Current User's Withdrawable Cash
    const currentUserData = await User.findById(user._id).select(
      "cashWithdrawable",
    );
    const userWithdrawableCash = currentUserData?.cashWithdrawable || 0;

    // 3. Total Clients (Active only)
    const totalClients = await Client.countDocuments({
      status: "ACTIVE",
    });

    // 4. Total Staffs (Active users excluding current user)
    const totalStaffs = await User.countDocuments({
      _id: { $ne: user._id },
      status: "ACTIVE",
    });

    // 5. Active Loans Count
    const activeLoans = await Loan.countDocuments({
      status: { $regex: new RegExp("^active$", "i") },
    });

    // 6. Total Outstanding Amount (sum of balance from all active cycles)
    const activeCycles = await Cycle.aggregate([
      {
        $match: {
          status: { $regex: new RegExp("^active$", "i") },
        },
      },
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: "$balance" },
        },
      },
    ]);
    const totalOutstanding = activeCycles[0]?.totalOutstanding || 0;

    // 7. Collections This Month
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const paymentsThisMonth = await Payment.aggregate([
      {
        $match: {
          datePaid: { $gte: firstDayOfMonth },
          status: { $ne: "DELETED" },
        },
      },
      {
        $group: {
          _id: null,
          totalCollections: { $sum: "$amount" },
        },
      },
    ]);
    const collectionsThisMonth = paymentsThisMonth[0]?.totalCollections || 0;

    // 8. Overdue Payments Count (Active cycles past due date)
    const overdueCycles = await Cycle.countDocuments({
      status: { $regex: new RegExp("^active$", "i") },
      dateDue: { $lt: now },
    });

    // 9. Analytics Data - Payment Collections Over Time
    const analyticsData = await Payment.aggregate([
      {
        $match: {
          datePaid: { $gte: startDate },
          status: { $ne: "DELETED" },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format:
                period === "monthly"
                  ? "%Y-%m"
                  : period === "fortnightly" || period === "weekly"
                    ? "%Y-W%V"
                    : "%Y-%m-%d",
              date: "$datePaid",
            },
          },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // 10. Analytics Data - Loan Disbursements Over Time
    const disbursementData = await Loan.aggregate([
      {
        $match: {
          dateStarted: { $gte: startDate },
          status: { $ne: "DELETED" },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format:
                period === "monthly"
                  ? "%Y-%m"
                  : period === "fortnightly" || period === "weekly"
                    ? "%Y-W%V"
                    : "%Y-%m-%d",
              date: "$dateStarted",
            },
          },
          totalAmount: { $sum: "$principal" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // 11. Recent Activities (Last 10 payments)
    const recentActivities = await Payment.find({
      status: { $ne: "DELETED" },
    })
      .populate({
        path: "loanId",
        select: "loanNumber",
        populate: {
          path: "clientId",
          select: "firstName lastName",
        },
      })
      .sort({ datePaid: -1 })
      .limit(10)
      .select("amount datePaid loanId");

    // 12. Loan Status Distribution
    const loanStatusDistribution = await Loan.aggregate([
      {
        $match: {
          status: { $ne: "DELETED" },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Return all dashboard data
    return NextResponse.json({
      success: true,
      data: {
        // Primary Metrics
        cashOnHand,
        userWithdrawableCash,
        totalClients,
        totalStaffs,

        // Secondary Metrics
        activeLoans,
        totalOutstanding,
        collectionsThisMonth,
        overdueCycles,

        // Analytics
        paymentCollections: analyticsData,
        loanDisbursements: disbursementData,
        recentActivities,
        loanStatusDistribution,

        // Metadata
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: now.toISOString(),
        },
      },
    });
  } catch (err: unknown) {
    console.error("Dashboard data fetch error:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

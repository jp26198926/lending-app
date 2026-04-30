import { NextRequest } from "next/server";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Payment, { PaymentStatus } from "@/models/Payment";
import Cycle, { CycleStatus } from "@/models/Cycle";
import Loan, { LoanStatus } from "@/models/Loan";
import User from "@/models/User";
import Role from "@/models/Role";
import Settings from "@/models/Settings";
import Ledger, {
  LedgerType,
  LedgerDirection,
  LedgerStatus,
} from "@/models/Ledger";
import UserLedger, {
  UserLedgerType,
  UserLedgerStatus,
} from "@/models/UserLedger";
import { withAuth } from "@/lib/apiAuth";

const PAGE_PATH = "/admin/payment";
// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

// GET - Fetch all payments with optional filtering
export async function GET(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const loanId = searchParams.get("loanId");
    const cycleId = searchParams.get("cycleId");

    // Build filter
    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (loanId) {
      filter.loanId = loanId;
    }

    if (cycleId) {
      filter.cycleId = cycleId;
    }

    const payments = await Payment.find(filter)
      .populate({
        path: "loanId",
        select: "loanNo clientId principal interestRate terms status",
        populate: {
          path: "clientId",
          select: "firstName middleName lastName email",
        },
      })
      .populate({
        path: "cycleId",
        select: "cycleCount totalDue balance dateDue status",
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email")
      .sort({ datePaid: -1, createdAt: -1 });

    return corsResponse(request, payments, 200);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return corsErrorResponse(
      request,
      { error: "Failed to fetch payments" },
      500,
    );
  }
}

// POST - Create a new payment
export async function POST(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const body = await request.json();
    const { loanId, cycleId, amount, datePaid, remarks, status } = body;

    // Validate required fields
    if (!loanId || !cycleId || amount === undefined || !datePaid) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        {
          error: "Loan, cycle, amount, and date paid are required",
        },
        400,
      );
    }

    // Validate numeric values
    if (amount < 0) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Amount must be a positive number" },
        400,
      );
    }

    await connectDB();

    // Auto-generate payment number within transaction
    const latestPayment = await Payment.findOne()
      .sort({ createdAt: -1 })
      .select("paymentNo")
      .session(session);

    let nextNumber = 1;
    if (latestPayment && latestPayment.paymentNo) {
      const match = latestPayment.paymentNo.match(/PAY-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const paymentNo = `PAY-${String(nextNumber).padStart(5, "0")}`;

    // Create payment
    const payment = await Payment.create(
      [
        {
          paymentNo,
          loanId,
          cycleId,
          amount,
          datePaid,
          remarks,
          createdBy: new mongoose.Types.ObjectId(user!.userId),
          status: status || PaymentStatus.COMPLETED,
        },
      ],
      { session },
    );

    // ============================================================
    // STEP 1: Update Cycle with payment information
    // ============================================================
    const cycle = await Cycle.findById(cycleId).session(session);

    if (!cycle) {
      await session.abortTransaction();
      return corsErrorResponse(request, { error: "Cycle not found" }, 404);
    }

    // Calculate new totals
    const newTotalPaid = cycle.totalPaid + amount;
    const newBalance = cycle.totalDue - newTotalPaid;

    // Calculate profit earned
    // The interest amount is the profit portion
    // We need to calculate how much of the payment goes to profit
    const remainingInterest = cycle.interestAmount - cycle.profitEarned;
    const profitFromThisPayment = Math.min(amount, remainingInterest);
    const newProfitEarned = cycle.profitEarned + profitFromThisPayment;
    const newProfitRemaining = cycle.profitExpected - newProfitEarned;

    // Update cycle status if fully paid
    const newStatus = newBalance <= 0 ? CycleStatus.COMPLETED : cycle.status;

    // Update the cycle
    await Cycle.findByIdAndUpdate(
      cycleId,
      {
        $set: {
          totalPaid: newTotalPaid,
          balance: Math.max(0, newBalance), // Ensure balance doesn't go negative
          profitEarned: newProfitEarned,
          profitRemaining: Math.max(0, newProfitRemaining),
          status: newStatus,
          updatedBy: new mongoose.Types.ObjectId(user!.userId),
          updatedAt: new Date(),
        },
      },
      { session },
    );

    // ============================================================
    // STEP 2: Create Ledger record for this payment
    // ============================================================
    await Ledger.create(
      [
        {
          date: new Date(datePaid),
          type: LedgerType.REPAYMENT,
          direction: LedgerDirection.IN,
          amount: amount,
          loanId: loanId,
          cycleId: cycleId,
          paymentId: payment[0]._id,
          description:
            remarks || `Payment ${paymentNo} for Cycle #${cycle.cycleCount}`,
          status: LedgerStatus.COMPLETED,
          createdBy: new mongoose.Types.ObjectId(user!.userId),
        },
      ],
      { session },
    );

    // ============================================================
    // STEP 2A: Update Settings - Increase Cash on Hand
    // ============================================================
    // Payment received means cash coming into the business
    const settings = await Settings.findOne().session(session);

    if (!settings) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        {
          error:
            "Settings not found. Please configure application settings first.",
        },
        404,
      );
    }

    await Settings.findByIdAndUpdate(
      settings._id,
      {
        $inc: {
          cashOnHand: amount, // Add payment amount to cash on hand
        },
        $set: {
          updatedBy: new mongoose.Types.ObjectId(user!.userId),
          updatedAt: new Date(),
        },
      },
      { session },
    );

    // ============================================================
    // STEP 3: Check if loan should be marked as COMPLETED
    // ============================================================
    if (newBalance <= 0) {
      // Get ALL cycles for this loan (including cancelled, expired, and completed)
      const allCycles = await Cycle.find({
        loanId: loanId,
      }).session(session);

      // Find the latest cycle by cycleCount
      const latestCycle = allCycles.reduce(
        (max, cycle) => (cycle.cycleCount > max.cycleCount ? cycle : max),
        allCycles[0],
      );

      // Check if the cycle being completed is the latest cycle
      const isLatestCycle =
        latestCycle && latestCycle._id.toString() === cycleId.toString();

      // Check if all cycles are in terminal states (Completed, Cancelled, Expired)
      const allCyclesTerminal = allCycles.every(
        (c) =>
          c._id.toString() === cycleId.toString() || // Current cycle being completed
          c.status === CycleStatus.COMPLETED ||
          c.status === CycleStatus.CANCELLED ||
          c.status === CycleStatus.EXPIRED,
      );

      // If latest cycle is completed AND all other cycles are terminal, complete the loan
      if (isLatestCycle && allCyclesTerminal) {
        // ============================================================
        // STEP 3A: Update Loan status to COMPLETED
        // ============================================================
        await Loan.findByIdAndUpdate(
          loanId,
          {
            $set: {
              status: LoanStatus.COMPLETED,
              updatedBy: new mongoose.Types.ObjectId(user!.userId),
              updatedAt: new Date(),
            },
          },
          { session },
        );

        // ============================================================
        // STEP 3B: Calculate and distribute profit sharing
        // ============================================================
        // Get the loan with assigned staff details
        const loan = await Loan.findById(loanId)
          .populate("assignedStaff")
          .session(session);

        if (!loan) {
          await session.abortTransaction();
          return corsErrorResponse(
            request,
            { error: "Loan not found for profit distribution" },
            404,
          );
        }

        // Calculate total profit from all cycles
        const totalProfitFromAllCycles = allCycles.reduce(
          (sum, cycle) => sum + cycle.profitEarned,
          0,
        );

        // Get assigned staff's rate
        const assignedStaff = loan.assignedStaff as any;
        const staffRate = assignedStaff.rate || 0; // Percentage (e.g., 20 means 20%)
        const staffProfit = (totalProfitFromAllCycles * staffRate) / 100;
        const adminProfit = totalProfitFromAllCycles - staffProfit;

        // Find the admin user (user with "Admin" role)
        const adminRole = await Role.findOne({
          role: { $regex: /^admin$/i }, // Case-insensitive match for "Admin"
          status: "ACTIVE",
        }).session(session);

        if (!adminRole) {
          await session.abortTransaction();
          return corsErrorResponse(
            request,
            { error: "Admin role not found" },
            404,
          );
        }

        const adminUser = await User.findOne({
          roleId: adminRole._id,
          status: "ACTIVE",
        }).session(session);

        if (!adminUser) {
          await session.abortTransaction();
          return corsErrorResponse(
            request,
            { error: "Admin user not found" },
            404,
          );
        }

        const currentDate = new Date(datePaid);

        // ============================================================
        // STEP 3C: Record profit sharing for STAFF (Internal allocation only)
        // ============================================================
        // NOTE: We don't create Ledger entries here because the money is still
        // part of cashOnHand in Settings. Ledger entries will be created when
        // the profit is actually withdrawn via the withdrawal process.

        if (staffProfit > 0) {
          // Create UserLedger entry for staff (tracks internal earnings allocation)
          await UserLedger.create(
            [
              {
                date: currentDate,
                amount: staffProfit,
                type: UserLedgerType.EARNING,
                userId: assignedStaff._id,
                loanId: loanId,
                status: UserLedgerStatus.COMPLETED,
                createdBy: new mongoose.Types.ObjectId(user!.userId),
              },
            ],
            { session },
          );

          // Update staff user's financial fields
          await User.findByIdAndUpdate(
            assignedStaff._id,
            {
              $inc: {
                profitEarned: staffProfit,
                cashWithdrawable: staffProfit,
              },
              $set: {
                updatedBy: new mongoose.Types.ObjectId(user!.userId),
                updatedAt: new Date(),
              },
            },
            { session },
          );
        }

        // ============================================================
        // STEP 3D: Record profit sharing for ADMIN (Internal allocation only)
        // ============================================================
        if (adminProfit > 0) {
          const adminRate = 100 - staffRate;

          // Create UserLedger entry for admin (tracks internal earnings allocation)
          await UserLedger.create(
            [
              {
                date: currentDate,
                amount: adminProfit,
                type: UserLedgerType.EARNING,
                userId: adminUser._id,
                loanId: loanId,
                status: UserLedgerStatus.COMPLETED,
                createdBy: new mongoose.Types.ObjectId(user!.userId),
              },
            ],
            { session },
          );

          // Update admin user's financial fields
          await User.findByIdAndUpdate(
            adminUser._id,
            {
              $inc: {
                profitEarned: adminProfit,
                cashWithdrawable: adminProfit,
              },
              $set: {
                updatedBy: new mongoose.Types.ObjectId(user!.userId),
                updatedAt: new Date(),
              },
            },
            { session },
          );
        }
      }
    }

    // ============================================================
    // STEP 4: Populate references for response
    // ============================================================
    await payment[0].populate({
      path: "loanId",
      select: "loanNo clientId principal interestRate terms status",
      populate: {
        path: "clientId",
        select: "firstName middleName lastName email",
      },
    });
    await payment[0].populate({
      path: "cycleId",
      select: "cycleCount totalDue balance dateDue status",
    });
    await payment[0].populate("createdBy", "firstName lastName email");

    await session.commitTransaction();

    return corsResponse(request, payment[0], 201);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Payment creation transaction error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to create payment",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    await session.endSession();
  }
}

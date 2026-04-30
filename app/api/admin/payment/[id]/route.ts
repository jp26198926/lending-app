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
import Settings from "@/models/Settings";
import Ledger, {
  LedgerStatus,
  LedgerType,
  LedgerDirection,
} from "@/models/Ledger";
import { withAuth } from "@/lib/apiAuth";
import "@/models/User";
import "@/models/Client";

const PAGE_PATH = "/admin/payment";
// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

// GET - Fetch a single payment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    const payment = await Payment.findById(id)
      .populate({
        path: "loanId",
        select: "loanNo clientId principal interestRate terms status",
        populate: {
          path: "clientId",
          select: "firstName middleName lastName email phone address",
        },
      })
      .populate({
        path: "cycleId",
        select: "cycleCount totalDue totalPaid balance dateDue status",
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email");

    if (!payment) {
      return corsErrorResponse(request, { error: "Payment not found" }, 404);
    }

    return corsResponse(request, payment, 200);
  } catch (error) {
    console.error("Error fetching payment:", error);
    return corsErrorResponse(
      request,
      { error: "Failed to fetch payment" },
      500,
    );
  }
}

// PUT - Update payment by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { id } = await params;
    const body = await request.json();

    const { loanId, cycleId, amount, datePaid, remarks, status } = body;

    await connectDB();

    // Find the payment
    const payment = await Payment.findById(id).session(session);

    if (!payment) {
      await session.abortTransaction();
      return corsErrorResponse(request, { error: "Payment not found" }, 404);
    }

    // Prevent editing cancelled payments
    if (payment.status === PaymentStatus.CANCELLED) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Cannot edit a cancelled payment" },
        403,
      );
    }

    // Validate numeric values if provided
    if (amount !== undefined && amount < 0) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Amount must be a positive number" },
        400,
      );
    }

    // ============================================================
    // STEP 1: Reverse old cycle updates if amount or cycle changed
    // ============================================================
    const oldAmount = payment.amount;
    const oldCycleId = payment.cycleId.toString();
    const newAmount = amount !== undefined ? amount : oldAmount;
    const newCycleId = cycleId ? cycleId.toString() : oldCycleId;

    const amountChanged = newAmount !== oldAmount;
    const cycleChanged = newCycleId !== oldCycleId;

    if (amountChanged || cycleChanged) {
      // Reverse the old payment from old cycle
      const oldCycle = await Cycle.findById(oldCycleId).session(session);

      if (oldCycle) {
        const reversedTotalPaid = oldCycle.totalPaid - oldAmount;
        const reversedBalance = oldCycle.totalDue - reversedTotalPaid;

        // Reverse profit calculation
        const profitReversed = Math.min(oldAmount, oldCycle.profitEarned);
        const reversedProfitEarned = oldCycle.profitEarned - profitReversed;
        const reversedProfitRemaining =
          oldCycle.profitExpected - reversedProfitEarned;

        // Determine status after reversal
        const oldCycleNewStatus =
          reversedBalance > 0 ? CycleStatus.ACTIVE : CycleStatus.COMPLETED;

        await Cycle.findByIdAndUpdate(
          oldCycleId,
          {
            $set: {
              totalPaid: Math.max(0, reversedTotalPaid),
              balance: Math.max(0, reversedBalance),
              profitEarned: Math.max(0, reversedProfitEarned),
              profitRemaining: Math.max(0, reversedProfitRemaining),
              status: oldCycleNewStatus,
              updatedBy: new mongoose.Types.ObjectId(user!.userId),
              updatedAt: new Date(),
            },
          },
          { session },
        );
      }

      // ============================================================
      // STEP 2: Apply new payment to new cycle
      // ============================================================
      const newCycle = await Cycle.findById(newCycleId).session(session);

      if (!newCycle) {
        await session.abortTransaction();
        return corsErrorResponse(
          request,
          { error: "New cycle not found" },
          404,
        );
      }

      // Calculate new cycle totals
      const updatedTotalPaid = newCycle.totalPaid + newAmount;
      const updatedBalance = newCycle.totalDue - updatedTotalPaid;

      // Calculate profit earned from this payment
      const remainingInterest = newCycle.interestAmount - newCycle.profitEarned;
      const profitFromPayment = Math.min(newAmount, remainingInterest);
      const updatedProfitEarned = newCycle.profitEarned + profitFromPayment;
      const updatedProfitRemaining =
        newCycle.profitExpected - updatedProfitEarned;

      // Update status if fully paid
      const updatedStatus =
        updatedBalance <= 0 ? CycleStatus.COMPLETED : newCycle.status;

      await Cycle.findByIdAndUpdate(
        newCycleId,
        {
          $set: {
            totalPaid: updatedTotalPaid,
            balance: Math.max(0, updatedBalance),
            profitEarned: updatedProfitEarned,
            profitRemaining: Math.max(0, updatedProfitRemaining),
            status: updatedStatus,
            updatedBy: new mongoose.Types.ObjectId(user!.userId),
            updatedAt: new Date(),
          },
        },
        { session },
      );

      // ============================================================
      // STEP 3: Update ledger record
      // ============================================================
      const ledger = await Ledger.findOne({ paymentId: id }).session(session);

      if (ledger) {
        await Ledger.findByIdAndUpdate(
          ledger._id,
          {
            $set: {
              amount: newAmount,
              date: datePaid ? new Date(datePaid) : ledger.date,
              loanId: loanId || payment.loanId,
              cycleId: newCycleId,
              description: remarks || ledger.description,
              updatedBy: new mongoose.Types.ObjectId(user!.userId),
              updatedAt: new Date(),
            },
          },
          { session },
        );
      }

      // ============================================================
      // STEP 3A: Check and update loan status based on all cycles
      // ============================================================
      const finalLoanId = loanId || payment.loanId;
      const allCycles = await Cycle.find({
        loanId: finalLoanId,
        status: { $ne: CycleStatus.CANCELLED },
      }).session(session);

      const allCyclesCompleted = allCycles.every(
        (c) => c.status === CycleStatus.COMPLETED,
      );

      const currentLoan = await Loan.findById(finalLoanId).session(session);

      if (currentLoan) {
        // Update loan status based on cycles
        if (allCyclesCompleted && currentLoan.status !== LoanStatus.COMPLETED) {
          // All cycles completed, mark loan as completed
          await Loan.findByIdAndUpdate(
            finalLoanId,
            {
              $set: {
                status: LoanStatus.COMPLETED,
                updatedBy: new mongoose.Types.ObjectId(user!.userId),
                updatedAt: new Date(),
              },
            },
            { session },
          );
        } else if (
          !allCyclesCompleted &&
          currentLoan.status === LoanStatus.COMPLETED
        ) {
          // Not all cycles completed, revert loan to active
          await Loan.findByIdAndUpdate(
            finalLoanId,
            {
              $set: {
                status: LoanStatus.ACTIVE,
                updatedBy: new mongoose.Types.ObjectId(user!.userId),
                updatedAt: new Date(),
              },
            },
            { session },
          );
        }
      }

      // ============================================================
      // STEP 3B: Update Settings - Adjust Cash on Hand if amount changed
      // ============================================================
      if (amountChanged) {
        const settings = await Settings.findOne().session(session);

        if (!settings) {
          await session.abortTransaction();
          return corsErrorResponse(
            request,
            { error: "Settings not found" },
            404,
          );
        }

        // Calculate the difference: positive = more cash, negative = less cash
        const cashDifference = newAmount - oldAmount;

        await Settings.findByIdAndUpdate(
          settings._id,
          {
            $inc: {
              cashOnHand: cashDifference, // Adjust by difference
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

    // ============================================================
    // STEP 4: Update payment record
    // ============================================================
    if (loanId) payment.loanId = loanId;
    if (cycleId) payment.cycleId = cycleId;
    if (amount !== undefined) payment.amount = amount;
    if (datePaid) payment.datePaid = datePaid;
    if (remarks !== undefined) payment.remarks = remarks;
    if (status) payment.status = status;
    payment.updatedBy = new mongoose.Types.ObjectId(user!.userId);
    payment.updatedAt = new Date();

    await payment.save({ session });

    // Populate and return
    const updatedPayment = await Payment.findById(id)
      .populate({
        path: "loanId",
        select: "loanNo clientId principal interestRate terms status",
        populate: {
          path: "clientId",
          select: "firstName middleName lastName email phone address",
        },
      })
      .populate({
        path: "cycleId",
        select: "cycleCount totalDue totalPaid balance dateDue status",
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return corsResponse(request, updatedPayment, 200);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Payment update transaction error:", err);

    // Handle duplicate key error
    if ((err as { code?: number }).code === 11000) {
      return corsErrorResponse(
        request,
        { error: "A payment with this payment number already exists" },
        409,
      );
    }

    return corsErrorResponse(
      request,
      {
        error: "Failed to update payment",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    await session.endSession();
  }
}

// DELETE - Soft delete payment by ID (cancel payment)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim() === "") {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Deletion reason is required" },
        400,
      );
    }

    await connectDB();

    const payment = await Payment.findById(id).session(session);

    if (!payment) {
      await session.abortTransaction();
      return corsErrorResponse(request, { error: "Payment not found" }, 404);
    }

    // Prevent deleting already cancelled payments
    if (payment.status === PaymentStatus.CANCELLED) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Payment is already cancelled" },
        403,
      );
    }

    // Only completed payments can be cancelled
    if (payment.status !== PaymentStatus.COMPLETED) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Only completed payments can be cancelled" },
        403,
      );
    }

    // ============================================================
    // STEP 1: Reverse cycle updates
    // ============================================================
    const cycle = await Cycle.findById(payment.cycleId).session(session);

    if (cycle) {
      // Subtract payment amount from cycle
      const reversedTotalPaid = cycle.totalPaid - payment.amount;
      const reversedBalance = cycle.totalDue - reversedTotalPaid;

      // Reverse profit calculation
      const profitReversed = Math.min(payment.amount, cycle.profitEarned);
      const reversedProfitEarned = cycle.profitEarned - profitReversed;
      const reversedProfitRemaining =
        cycle.profitExpected - reversedProfitEarned;

      // Update cycle status - if was completed but now has balance, set back to active
      const newCycleStatus =
        reversedBalance > 0 ? CycleStatus.ACTIVE : cycle.status;

      await Cycle.findByIdAndUpdate(
        payment.cycleId,
        {
          $set: {
            totalPaid: Math.max(0, reversedTotalPaid),
            balance: Math.max(0, reversedBalance),
            profitEarned: Math.max(0, reversedProfitEarned),
            profitRemaining: Math.max(0, reversedProfitRemaining),
            status: newCycleStatus,
            updatedBy: new mongoose.Types.ObjectId(user!.userId),
            updatedAt: new Date(),
          },
        },
        { session },
      );
    }

    // ============================================================
    // STEP 2: Cancel associated ledger record
    // ============================================================
    const ledger = await Ledger.findOne({ paymentId: id }).session(session);

    if (ledger && ledger.status !== LedgerStatus.CANCELLED) {
      await Ledger.findByIdAndUpdate(
        ledger._id,
        {
          $set: {
            status: LedgerStatus.CANCELLED,
            updatedBy: new mongoose.Types.ObjectId(user!.userId),
            updatedAt: new Date(),
            deletedAt: new Date(),
            deletedBy: new mongoose.Types.ObjectId(user!.userId),
            deletedReason: `Payment cancelled: ${reason}`,
          },
        },
        { session },
      );

      // Create a new ledger entry to record the cancellation/reversal
      await Ledger.create(
        [
          {
            date: new Date(),
            type: LedgerType.REPAYMENT,
            direction: LedgerDirection.OUT,
            amount: payment.amount,
            loanId: payment.loanId,
            cycleId: payment.cycleId,
            paymentId: payment._id,
            description: `Payment ${payment.paymentNo} cancelled - ${reason}`,
            status: LedgerStatus.COMPLETED,
            createdBy: new mongoose.Types.ObjectId(user!.userId),
          },
        ],
        { session },
      );
    }

    // ============================================================
    // STEP 2A: Check if loan status should be reverted
    // ============================================================
    const loan = await Loan.findById(payment.loanId).session(session);

    if (loan && loan.status === LoanStatus.COMPLETED) {
      // Loan was marked as completed, but now a payment is cancelled
      // We need to check if all cycles are still completed
      const allCycles = await Cycle.find({
        loanId: payment.loanId,
        status: { $ne: CycleStatus.CANCELLED },
      }).session(session);

      const allCyclesStillCompleted = allCycles.every(
        (c) => c.status === CycleStatus.COMPLETED,
      );

      // If not all cycles are completed anymore, revert loan to ACTIVE
      if (!allCyclesStillCompleted) {
        await Loan.findByIdAndUpdate(
          payment.loanId,
          {
            $set: {
              status: LoanStatus.ACTIVE,
              updatedBy: new mongoose.Types.ObjectId(user!.userId),
              updatedAt: new Date(),
            },
          },
          { session },
        );

        // NOTE: Profit sharing reversal (UserLedger and User financial fields)
        // is not implemented here to maintain data integrity and audit trail.
        // Consider implementing a separate reconciliation process if needed.
      }
    }

    // ============================================================
    // STEP 2B: Update Settings - Decrease Cash on Hand
    // ============================================================
    // Cancelling payment means the cash inflow is reversed
    const settings = await Settings.findOne().session(session);

    if (!settings) {
      await session.abortTransaction();
      return corsErrorResponse(request, { error: "Settings not found" }, 404);
    }

    await Settings.findByIdAndUpdate(
      settings._id,
      {
        $inc: {
          cashOnHand: -payment.amount, // Subtract cancelled payment amount
        },
        $set: {
          updatedBy: new mongoose.Types.ObjectId(user!.userId),
          updatedAt: new Date(),
        },
      },
      { session },
    );

    // ============================================================
    // STEP 3: Soft delete (cancel) payment
    // ============================================================
    payment.status = PaymentStatus.CANCELLED;
    payment.deletedAt = new Date();
    payment.deletedBy = new mongoose.Types.ObjectId(user!.userId);
    payment.deletedReason = reason;

    await payment.save({ session });

    // Populate and return
    const deletedPayment = await Payment.findById(id)
      .populate({
        path: "loanId",
        select: "loanNo clientId principal interestRate terms status",
        populate: {
          path: "clientId",
          select: "firstName middleName lastName email phone address",
        },
      })
      .populate({
        path: "cycleId",
        select: "cycleCount totalDue totalPaid balance dateDue status",
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return corsResponse(request, deletedPayment, 200);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Payment deletion transaction error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to delete payment",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    await session.endSession();
  }
}

import { NextRequest } from "next/server";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Ledger, { LedgerStatus } from "@/models/Ledger";
import Settings from "@/models/Settings";
import User from "@/models/User";
import UserLedger, {
  UserLedgerType,
  UserLedgerStatus,
} from "@/models/UserLedger";
import { withAuth } from "@/lib/apiAuth";
import "@/models/Loan";
import "@/models/Cycle";
import "@/models/Payment";
import "@/models/Client";

const PAGE_PATH = "/admin/ledger";
// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

// GET - Fetch a single ledger entry by ID
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

    const ledger = await Ledger.findById(id)
      .populate("userId", "firstName lastName email phone")
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
      .populate({
        path: "paymentId",
        select: "paymentNo amount datePaid status",
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email");

    if (!ledger) {
      return corsErrorResponse(
        request,
        { error: "Ledger entry not found" },
        404,
      );
    }

    return corsResponse(request, ledger, 200);
  } catch (error) {
    console.error("Error fetching ledger entry:", error);
    return corsErrorResponse(
      request,
      { error: "Failed to fetch ledger entry" },
      500,
    );
  }
}

// PUT - Update ledger entry by ID
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

    const {
      date,
      userId,
      type,
      direction,
      amount,
      loanId,
      cycleId,
      paymentId,
      description,
      status,
    } = body;

    await connectDB();

    // Find the ledger entry
    const ledger = await Ledger.findById(id).session(session);

    if (!ledger) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Ledger entry not found" },
        404,
      );
    }

    // Prevent editing cancelled ledger entries
    if (ledger.status === LedgerStatus.CANCELLED) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Cannot edit a cancelled ledger entry" },
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

    // Update fields
    if (date) ledger.date = date;
    if (userId !== undefined) ledger.userId = userId;
    if (type) ledger.type = type;
    if (direction) ledger.direction = direction;
    if (amount !== undefined) ledger.amount = amount;
    if (loanId !== undefined) ledger.loanId = loanId;
    if (cycleId !== undefined) ledger.cycleId = cycleId;
    if (paymentId !== undefined) ledger.paymentId = paymentId;
    if (description !== undefined) ledger.description = description;
    if (status) ledger.status = status;
    ledger.updatedBy = new mongoose.Types.ObjectId(user!.userId);
    ledger.updatedAt = new Date();

    await ledger.save({ session });

    // Populate and return
    const updatedLedger = await Ledger.findById(id)
      .populate("userId", "firstName lastName email phone")
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
      .populate({
        path: "paymentId",
        select: "paymentNo amount datePaid status",
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return corsResponse(request, updatedLedger, 200);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Ledger update transaction error:", err);

    return corsErrorResponse(
      request,
      {
        error: "Failed to update ledger entry",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    await session.endSession();
  }
}

// DELETE - Soft delete ledger entry by ID (cancel ledger entry)
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

    const ledger = await Ledger.findById(id).session(session);

    if (!ledger) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Ledger entry not found" },
        404,
      );
    }

    // Prevent deleting already cancelled ledger entries
    if (ledger.status === LedgerStatus.CANCELLED) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Ledger entry is already cancelled" },
        403,
      );
    }

    // Only completed ledger entries can be cancelled
    if (ledger.status !== LedgerStatus.COMPLETED) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Only completed ledger entries can be cancelled" },
        403,
      );
    }

    // Soft delete (cancel)
    ledger.status = LedgerStatus.CANCELLED;
    ledger.deletedAt = new Date();
    ledger.deletedBy = new mongoose.Types.ObjectId(user!.userId);
    ledger.deletedReason = reason;

    await ledger.save({ session });

    // If direction is "In", deduct from settings cash on hand
    if (ledger.direction === "In") {
      const settings = await Settings.findOne().session(session);

      if (!settings) {
        await session.abortTransaction();
        return corsErrorResponse(
          request,
          { error: "Settings not found. Cannot reverse cash on hand." },
          404,
        );
      }

      const newCashOnHand = settings.cashOnHand - ledger.amount;

      // Prevent negative cash on hand
      if (newCashOnHand < 0) {
        await session.abortTransaction();
        return corsErrorResponse(
          request,
          {
            error: "Insufficient cash on hand to reverse this transaction.",
            details: `Current balance: ${settings.cashOnHand.toFixed(2)}, Requested deduction: ${ledger.amount.toFixed(2)}`,
          },
          400,
        );
      }

      await Settings.findByIdAndUpdate(
        settings._id,
        {
          $set: {
            cashOnHand: newCashOnHand,
            updatedBy: new mongoose.Types.ObjectId(user!.userId),
            updatedAt: new Date(),
          },
        },
        { session },
      );
    }

    // If Capital In with userId, deduct from user's cashWithdrawable and capitalContribution
    if (ledger.type === "Capital In" && ledger.userId) {
      const targetUser = await User.findById(ledger.userId).session(session);

      if (targetUser) {
        // Prevent negative values
        if (
          targetUser.cashWithdrawable < ledger.amount ||
          targetUser.capitalContribution < ledger.amount
        ) {
          await session.abortTransaction();
          return corsErrorResponse(
            request,
            {
              error:
                "Insufficient user balance to reverse this Capital In transaction.",
              details: `User withdrawable: ${targetUser.cashWithdrawable.toFixed(2)}, Capital contribution: ${targetUser.capitalContribution.toFixed(2)}, Requested deduction: ${ledger.amount.toFixed(2)}`,
            },
            400,
          );
        }

        await User.findByIdAndUpdate(
          ledger.userId,
          {
            $inc: {
              cashWithdrawable: -ledger.amount,
              capitalContribution: -ledger.amount,
            },
            $set: {
              updatedBy: new mongoose.Types.ObjectId(user!.userId),
              updatedAt: new Date(),
            },
          },
          { session },
        );

        // Cancel corresponding UserLedger entry
        // Find the UserLedger entry that matches this ledger
        const userLedgerEntry = await UserLedger.findOne({
          userId: ledger.userId,
          type: UserLedgerType.CAPITAL_IN,
          amount: ledger.amount,
          date: ledger.date,
          status: UserLedgerStatus.COMPLETED,
        })
          .sort({ createdAt: -1 })
          .session(session);

        if (userLedgerEntry) {
          userLedgerEntry.status = UserLedgerStatus.CANCELLED;
          userLedgerEntry.deletedAt = new Date();
          userLedgerEntry.deletedBy = new mongoose.Types.ObjectId(user!.userId);
          userLedgerEntry.deletedReason = reason;
          await userLedgerEntry.save({ session });
        }
      }
    }

    // Populate and return
    const deletedLedger = await Ledger.findById(id)
      .populate("userId", "firstName lastName email phone")
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
      .populate({
        path: "paymentId",
        select: "paymentNo amount datePaid status",
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return corsResponse(request, deletedLedger, 200);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Ledger deletion transaction error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to delete ledger entry",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    await session.endSession();
  }
}

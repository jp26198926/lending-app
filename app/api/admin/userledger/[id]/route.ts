import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import UserLedger, { UserLedgerStatus } from "@/models/UserLedger";
import { withAuth } from "@/lib/apiAuth";
import "@/models/User";
import "@/models/Loan";

const PAGE_PATH = "/admin/userledger";

// GET - Fetch a single user ledger by ID
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

    const userLedger = await UserLedger.findById(id)
      .populate("userId", "firstName lastName email phone rate cashWithdrawable")
      .populate({
        path: "loanId",
        select: "loanNo clientId principal interestRate terms status",
        populate: {
          path: "clientId",
          select: "firstName middleName lastName email",
        },
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email");

    if (!userLedger) {
      return NextResponse.json(
        { error: "User ledger not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(userLedger, { status: 200 });
  } catch (error) {
    console.error("Error fetching user ledger:", error);
    return NextResponse.json(
      { error: "Failed to fetch user ledger" },
      { status: 500 },
    );
  }
}

// PUT - Update user ledger by ID
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

    const { date, amount, type, userId, loanId, status } = body;

    await connectDB();

    // Find the user ledger
    const userLedger = await UserLedger.findById(id).session(session);

    if (!userLedger) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "User ledger not found" },
        { status: 404 },
      );
    }

    // Prevent editing cancelled entries
    if (userLedger.status === UserLedgerStatus.CANCELLED) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Cannot edit a cancelled user ledger entry" },
        { status: 403 },
      );
    }

    // Validate numeric values if provided
    if (amount !== undefined && amount < 0) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 },
      );
    }

    // Update fields
    if (date) userLedger.date = date;
    if (amount !== undefined) userLedger.amount = amount;
    if (type) userLedger.type = type;
    if (userId) userLedger.userId = userId;
    if (loanId !== undefined) userLedger.loanId = loanId || undefined;
    if (status) userLedger.status = status;
    userLedger.updatedBy = user._id;
    userLedger.updatedAt = new Date();

    await userLedger.save({ session });

    // Populate and return
    const updatedUserLedger = await UserLedger.findById(id)
      .populate("userId", "firstName lastName email phone rate cashWithdrawable")
      .populate({
        path: "loanId",
        select: "loanNo clientId principal interestRate terms status",
        populate: {
          path: "clientId",
          select: "firstName middleName lastName email",
        },
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return NextResponse.json(updatedUserLedger, { status: 200 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("User ledger update transaction error:", err);

    return NextResponse.json(
      {
        error: "Failed to update user ledger",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

// DELETE - Soft delete user ledger by ID (cancel entry)
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
      return NextResponse.json(
        { error: "Deletion reason is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const userLedger = await UserLedger.findById(id).session(session);

    if (!userLedger) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "User ledger not found" },
        { status: 404 },
      );
    }

    // Prevent deleting already cancelled entries
    if (userLedger.status === UserLedgerStatus.CANCELLED) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "User ledger entry is already cancelled" },
        { status: 403 },
      );
    }

    // Only completed entries can be cancelled
    if (userLedger.status !== UserLedgerStatus.COMPLETED) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Only completed entries can be cancelled" },
        { status: 403 },
      );
    }

    // Soft delete (cancel)
    userLedger.status = UserLedgerStatus.CANCELLED;
    userLedger.deletedAt = new Date();
    userLedger.deletedBy = user._id;
    userLedger.deletedReason = reason;

    await userLedger.save({ session });

    // Populate and return
    const deletedUserLedger = await UserLedger.findById(id)
      .populate("userId", "firstName lastName email phone rate cashWithdrawable")
      .populate({
        path: "loanId",
        select: "loanNo clientId principal interestRate terms status",
        populate: {
          path: "clientId",
          select: "firstName middleName lastName email",
        },
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return NextResponse.json(deletedUserLedger, { status: 200 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("User ledger deletion transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to delete user ledger",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

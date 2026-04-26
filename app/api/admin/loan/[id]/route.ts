import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Loan, { LoanStatus } from "@/models/Loan";
import Cycle from "@/models/Cycle";
import { withAuth } from "@/lib/apiAuth";
import "@/models/Client";
import "@/models/User";

const PAGE_PATH = "/admin/loan";

// GET - Fetch single loan by ID
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

    const loan = await Loan.findOne({
      _id: id,
    })
      .populate("clientId", "firstName middleName lastName email phone address")
      .populate("assignedStaff", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email")
      .lean();

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    return NextResponse.json(loan, { status: 200 });
  } catch (error) {
    console.error("Error fetching loan:", error);
    return NextResponse.json(
      { error: "Failed to fetch loan" },
      { status: 500 },
    );
  }
}

// PUT - Update loan by ID
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
      clientId,
      principal,
      interestRate,
      terms,
      dateStarted,
      assignedStaff,
      status,
    } = body;

    await connectDB();

    // Find the loan
    const loan = await Loan.findById(id).session(session);

    if (!loan) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Prevent editing cancelled loans
    if (loan.status === LoanStatus.CANCELLED) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Cannot edit a cancelled loan" },
        { status: 403 },
      );
    }

    // Validate numeric values if provided
    if (principal !== undefined && principal < 0) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Principal must be a positive number" },
        { status: 400 },
      );
    }

    if (interestRate !== undefined && interestRate < 0) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Interest rate must be a positive number" },
        { status: 400 },
      );
    }

    // Update fields (loanNo cannot be updated - it's auto-generated)
    if (clientId) loan.clientId = clientId;
    if (principal !== undefined) loan.principal = principal;
    if (interestRate !== undefined) loan.interestRate = interestRate;
    if (terms) loan.terms = terms;
    if (dateStarted) loan.dateStarted = dateStarted;
    if (assignedStaff) loan.assignedStaff = assignedStaff;
    if (status) loan.status = status;
    loan.updatedBy = new mongoose.Types.ObjectId(user!.userId);
    loan.updatedAt = new Date();

    await loan.save({ session });

    // Populate and return
    const updatedLoan = await Loan.findById(id)
      .populate("clientId", "firstName middleName lastName email phone address")
      .populate("assignedStaff", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return NextResponse.json(updatedLoan, { status: 200 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Loan update transaction error:", err);

    // Handle duplicate key error
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "A loan with this loan number already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update loan",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

// DELETE - Soft delete loan by ID
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

    const loan = await Loan.findById(id).session(session);

    if (!loan) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Prevent deleting already cancelled loans
    if (loan.status === LoanStatus.CANCELLED) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Loan is already cancelled" },
        { status: 403 },
      );
    }

    // Only active loans can be cancelled
    if (loan.status !== LoanStatus.ACTIVE) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Only active loans can be cancelled" },
        { status: 403 },
      );
    }

    // Check if loan has any active cycles
    const activeCycles = await Cycle.findOne({
      loanId: id,
      status: "Active",
    }).session(session);

    if (activeCycles) {
      await session.abortTransaction();
      return NextResponse.json(
        {
          error:
            "Cannot delete this loan because it has active cycles. Please complete or cancel all active cycles first.",
        },
        { status: 403 },
      );
    }

    // Soft delete
    loan.status = LoanStatus.CANCELLED;
    loan.deletedAt = new Date();
    loan.deletedBy = new mongoose.Types.ObjectId(user!.userId);
    loan.deletedReason = reason;

    await loan.save({ session });

    // Populate and return
    const deletedLoan = await Loan.findById(id)
      .populate("clientId", "firstName middleName lastName email phone address")
      .populate("assignedStaff", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return NextResponse.json(deletedLoan, { status: 200 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Loan deletion transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to delete loan",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

// PATCH - Activate loan by ID (opposite of soft delete)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission (using Edit permission)
  const { user, error } = await withAuth(request, PAGE_PATH, "Edit");
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { id } = await params;

    await connectDB();

    const loan = await Loan.findById(id).session(session);

    if (!loan) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Activate the loan
    loan.status = LoanStatus.ACTIVE;
    loan.deletedAt = undefined;
    loan.deletedBy = undefined;
    loan.deletedReason = undefined;
    loan.updatedBy = new mongoose.Types.ObjectId(user!.userId);
    loan.updatedAt = new Date();

    await loan.save({ session });

    // Populate and return
    const activatedLoan = await Loan.findById(id)
      .populate("clientId", "firstName middleName lastName email phone address")
      .populate("assignedStaff", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return NextResponse.json(activatedLoan, { status: 200 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Loan activation transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to activate loan",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

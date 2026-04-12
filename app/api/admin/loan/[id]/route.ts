import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Loan, { LoanStatus } from "@/models/Loan";
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

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const {
      clientId,
      principal,
      interestRate,
      terms,
      dateStarted,
      assignedStaff,
      updatedBy,
      status,
    } = body;

    // Find the loan
    const loan = await Loan.findById(id);

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Prevent editing cancelled loans
    if (loan.status === LoanStatus.CANCELLED) {
      return NextResponse.json(
        { error: "Cannot edit a cancelled loan" },
        { status: 403 },
      );
    }

    // Validate numeric values if provided
    if (principal !== undefined && principal < 0) {
      return NextResponse.json(
        { error: "Principal must be a positive number" },
        { status: 400 },
      );
    }

    if (interestRate !== undefined && interestRate < 0) {
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
    if (updatedBy) loan.updatedBy = updatedBy;

    await loan.save();

    // Populate and return
    const updatedLoan = await Loan.findById(id)
      .populate("clientId", "firstName middleName lastName email phone address")
      .populate("assignedStaff", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email");

    return NextResponse.json(updatedLoan, { status: 200 });
  } catch (error) {
    console.error("Error updating loan:", error);

    // Handle duplicate key error
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "A loan with this loan number already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update loan" },
      { status: 500 },
    );
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

  try {
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deletedBy = searchParams.get("deletedBy");
    const deletedReason = searchParams.get("deletedReason");

    const loan = await Loan.findById(id);

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Prevent deleting already cancelled loans
    if (loan.status === LoanStatus.CANCELLED) {
      return NextResponse.json(
        { error: "Loan is already cancelled" },
        { status: 403 },
      );
    }

    // Only active loans can be cancelled
    if (loan.status !== LoanStatus.ACTIVE) {
      return NextResponse.json(
        { error: "Only active loans can be cancelled" },
        { status: 403 },
      );
    }

    // Soft delete
    loan.status = LoanStatus.CANCELLED;
    loan.deletedAt = new Date();
    if (deletedBy) loan.deletedBy = deletedBy;
    if (deletedReason) loan.deletedReason = deletedReason;

    await loan.save();

    // Populate and return
    const deletedLoan = await Loan.findById(id)
      .populate("clientId", "firstName middleName lastName email phone address")
      .populate("assignedStaff", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email");

    return NextResponse.json(deletedLoan, { status: 200 });
  } catch (error) {
    console.error("Error deleting loan:", error);
    return NextResponse.json(
      { error: "Failed to delete loan" },
      { status: 500 },
    );
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

  try {
    await connectDB();
    const { id } = await params;

    const loan = await Loan.findById(id);

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    // Activate the loan
    loan.status = LoanStatus.ACTIVE;
    loan.deletedAt = undefined;
    loan.deletedBy = undefined;
    loan.deletedReason = undefined;

    await loan.save();

    // Populate and return
    const activatedLoan = await Loan.findById(id)
      .populate("clientId", "firstName middleName lastName email phone address")
      .populate("assignedStaff", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email");

    return NextResponse.json(activatedLoan, { status: 200 });
  } catch (error) {
    console.error("Error activating loan:", error);
    return NextResponse.json(
      { error: "Failed to activate loan" },
      { status: 500 },
    );
  }
}

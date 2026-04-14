import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Cycle, { CycleStatus } from "@/models/Cycle";
import { withAuth } from "@/lib/apiAuth";
import "@/models/Loan";
import "@/models/User";

const PAGE_PATH = "/admin/cycle";

// GET - Fetch a single cycle by ID
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

    const cycle = await Cycle.findById(id)
      .populate({
        path: "loanId",
        select: "loanNo clientId principal interestRate terms status",
        populate: {
          path: "clientId",
          select: "firstName middleName lastName email phone address",
        },
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email");

    if (!cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    return NextResponse.json(cycle, { status: 200 });
  } catch (error) {
    console.error("Error fetching cycle:", error);
    return NextResponse.json(
      { error: "Failed to fetch cycle" },
      { status: 500 },
    );
  }
}

// PUT - Update cycle by ID
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
      loanId,
      cycleCount,
      principal,
      interestRate,
      interestAmount,
      totalDue,
      totalPaid,
      balance,
      profitExpected,
      profitEarned,
      profitRemaining,
      dateDue,
      updatedBy,
      status,
    } = body;

    // Find the cycle
    const cycle = await Cycle.findById(id);

    if (!cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    // Prevent editing cancelled cycles
    if (cycle.status === CycleStatus.CANCELLED) {
      return NextResponse.json(
        { error: "Cannot edit a cancelled cycle" },
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

    if (cycleCount !== undefined && cycleCount < 1) {
      return NextResponse.json(
        { error: "Cycle count must be at least 1" },
        { status: 400 },
      );
    }

    // Update fields
    if (loanId) cycle.loanId = loanId;
    if (cycleCount !== undefined) cycle.cycleCount = cycleCount;
    if (principal !== undefined) cycle.principal = principal;
    if (interestRate !== undefined) cycle.interestRate = interestRate;
    if (interestAmount !== undefined) cycle.interestAmount = interestAmount;
    if (totalDue !== undefined) cycle.totalDue = totalDue;
    if (totalPaid !== undefined) cycle.totalPaid = totalPaid;
    if (balance !== undefined) cycle.balance = balance;
    if (profitExpected !== undefined) cycle.profitExpected = profitExpected;
    if (profitEarned !== undefined) cycle.profitEarned = profitEarned;
    if (profitRemaining !== undefined) cycle.profitRemaining = profitRemaining;
    if (dateDue) cycle.dateDue = dateDue;
    if (status) cycle.status = status;
    if (updatedBy) cycle.updatedBy = updatedBy;

    await cycle.save();

    // Populate and return
    const updatedCycle = await Cycle.findById(id)
      .populate({
        path: "loanId",
        select: "loanNo clientId principal interestRate terms status",
        populate: {
          path: "clientId",
          select: "firstName middleName lastName email phone address",
        },
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email");

    return NextResponse.json(updatedCycle, { status: 200 });
  } catch (error) {
    console.error("Error updating cycle:", error);

    // Handle duplicate key error
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "A cycle with this loan and cycle count already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update cycle" },
      { status: 500 },
    );
  }
}

// DELETE - Soft delete cycle by ID
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

    const cycle = await Cycle.findById(id);

    if (!cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    // Prevent deleting already cancelled cycles
    if (cycle.status === CycleStatus.CANCELLED) {
      return NextResponse.json(
        { error: "Cycle is already cancelled" },
        { status: 403 },
      );
    }

    // Only active cycles can be cancelled
    if (cycle.status !== CycleStatus.ACTIVE) {
      return NextResponse.json(
        { error: "Only active cycles can be cancelled" },
        { status: 403 },
      );
    }

    // Soft delete
    cycle.status = CycleStatus.CANCELLED;
    cycle.deletedAt = new Date();
    if (deletedBy) cycle.deletedBy = deletedBy;
    if (deletedReason) cycle.deletedReason = deletedReason;

    await cycle.save();

    // Populate and return
    const deletedCycle = await Cycle.findById(id)
      .populate({
        path: "loanId",
        select: "loanNo clientId principal interestRate terms status",
        populate: {
          path: "clientId",
          select: "firstName middleName lastName email phone address",
        },
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email");

    return NextResponse.json(deletedCycle, { status: 200 });
  } catch (error) {
    console.error("Error deleting cycle:", error);
    return NextResponse.json(
      { error: "Failed to delete cycle" },
      { status: 500 },
    );
  }
}

// PATCH - Activate cycle by ID (opposite of soft delete)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    const cycle = await Cycle.findById(id);

    if (!cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    // Activate cycle
    cycle.status = CycleStatus.ACTIVE;
    cycle.deletedAt = undefined;
    cycle.deletedBy = undefined;
    cycle.deletedReason = undefined;

    await cycle.save();

    // Populate and return
    const activatedCycle = await Cycle.findById(id)
      .populate({
        path: "loanId",
        select: "loanNo clientId principal interestRate terms status",
        populate: {
          path: "clientId",
          select: "firstName middleName lastName email phone address",
        },
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email");

    return NextResponse.json(activatedCycle, { status: 200 });
  } catch (error) {
    console.error("Error activating cycle:", error);
    return NextResponse.json(
      { error: "Failed to activate cycle" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
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

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

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
      status,
    } = body;

    await connectDB();

    // Find the cycle
    const cycle = await Cycle.findById(id).session(session);

    if (!cycle) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    // Security: Prevent reactivating a cancelled cycle if an active cycle already exists
    if (
      status &&
      cycle.status === CycleStatus.CANCELLED &&
      status === CycleStatus.ACTIVE
    ) {
      // Check for existing active cycle for this loan
      const existingActiveCycle = await Cycle.findOne({
        loanId: cycle.loanId,
        status: CycleStatus.ACTIVE,
        _id: { $ne: id }, // Exclude current cycle
      }).session(session);

      if (existingActiveCycle) {
        await session.abortTransaction();
        return NextResponse.json(
          {
            error:
              "Cannot reactivate this cycle. An active cycle already exists for this loan. Please cancel or complete the existing active cycle first.",
          },
          { status: 409 },
        );
      }
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

    if (cycleCount !== undefined && cycleCount < 1) {
      await session.abortTransaction();
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
    cycle.updatedBy = user._id;
    cycle.updatedAt = new Date();

    await cycle.save({ session });

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
      .populate("updatedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return NextResponse.json(updatedCycle, { status: 200 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Cycle update transaction error:", err);

    // Handle duplicate key error
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { error: "A cycle with this loan and cycle count already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update cycle",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
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

    const cycle = await Cycle.findById(id).session(session);

    if (!cycle) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    // Prevent deleting already cancelled cycles
    if (cycle.status === CycleStatus.CANCELLED) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Cycle is already cancelled" },
        { status: 403 },
      );
    }

    // Only active cycles can be cancelled
    if (cycle.status !== CycleStatus.ACTIVE) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Only active cycles can be cancelled" },
        { status: 403 },
      );
    }

    // Soft delete
    cycle.status = CycleStatus.CANCELLED;
    cycle.deletedAt = new Date();
    cycle.deletedBy = user._id;
    cycle.deletedReason = reason;

    await cycle.save({ session });

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
      .populate("deletedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return NextResponse.json(deletedCycle, { status: 200 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Cycle deletion transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to delete cycle",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
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

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { id } = await params;

    await connectDB();

    const cycle = await Cycle.findById(id).session(session);

    if (!cycle) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    // Security: Prevent activating if there's already an active cycle for this loan
    const existingActiveCycle = await Cycle.findOne({
      loanId: cycle.loanId,
      status: CycleStatus.ACTIVE,
      _id: { $ne: id }, // Exclude current cycle
    }).session(session);

    if (existingActiveCycle) {
      await session.abortTransaction();
      return NextResponse.json(
        {
          error:
            "Cannot activate this cycle. An active cycle already exists for this loan. Please cancel or complete the existing active cycle first.",
        },
        { status: 409 },
      );
    }

    // Activate cycle
    cycle.status = CycleStatus.ACTIVE;
    cycle.deletedAt = undefined;
    cycle.deletedBy = undefined;
    cycle.deletedReason = undefined;
    cycle.updatedBy = user._id;
    cycle.updatedAt = new Date();

    await cycle.save({ session });

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
      .populate("updatedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return NextResponse.json(activatedCycle, { status: 200 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Cycle activation transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to activate cycle",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

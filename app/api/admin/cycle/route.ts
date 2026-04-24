import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Cycle, { CycleStatus } from "@/models/Cycle";
import { withAuth } from "@/lib/apiAuth";
import "@/models/Loan";
import "@/models/User";

const PAGE_PATH = "/admin/cycle";

// GET - Fetch all cycles with optional filtering
export async function GET(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const loanId = searchParams.get("loanId");

    // Build filter
    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (loanId) {
      filter.loanId = loanId;
    }

    const cycles = await Cycle.find(filter)
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
      .sort({ dateDue: 1, cycleCount: 1 });

    return NextResponse.json(cycles, { status: 200 });
  } catch (error) {
    console.error("Error fetching cycles:", error);
    return NextResponse.json(
      { error: "Failed to fetch cycles" },
      { status: 500 },
    );
  }
}

// POST - Create a new cycle
export async function POST(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const body = await request.json();
    const {
      loanId,
      cycleCount,
      principal,
      interestRate,
      interestAmount,
      totalDue,
      dateDue,
      status,
    } = body;

    // Validate required fields
    if (
      !loanId ||
      cycleCount === undefined ||
      principal === undefined ||
      interestRate === undefined ||
      interestAmount === undefined ||
      totalDue === undefined ||
      !dateDue
    ) {
      await session.abortTransaction();
      return NextResponse.json(
        {
          error:
            "Loan, cycle count, principal, interest rate, interest amount, total due, and due date are required",
        },
        { status: 400 },
      );
    }

    // Validate numeric values
    if (principal < 0) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Principal must be a positive number" },
        { status: 400 },
      );
    }

    if (interestRate < 0) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Interest rate must be a positive number" },
        { status: 400 },
      );
    }

    if (cycleCount < 1) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Cycle count must be at least 1" },
        { status: 400 },
      );
    }

    await connectDB();

    // Check for existing active cycle for this loan
    const existingActiveCycle = await Cycle.findOne({
      loanId,
      status: CycleStatus.ACTIVE,
    }).session(session);

    if (existingActiveCycle) {
      await session.abortTransaction();
      return NextResponse.json(
        {
          error:
            "Cannot create a new cycle. An active cycle already exists for this loan. Please complete or cancel the existing cycle first.",
        },
        { status: 409 },
      );
    }

    // Auto-calculate derived fields
    const totalPaid = 0; // Initially no payments
    const balance = totalDue; // Initial balance is total due
    const profitExpected = interestAmount; // Expected profit is the interest
    const profitEarned = 0; // Initially no profit earned
    const profitRemaining = profitExpected; // Initially all profit remaining

    // Create cycle
    const cycle = await Cycle.create(
      [
        {
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
          createdBy: user._id,
          status: status || CycleStatus.ACTIVE,
        },
      ],
      { session },
    );

    // Populate references for response
    await cycle[0].populate({
      path: "loanId",
      select: "loanNo clientId principal interestRate terms status",
      populate: {
        path: "clientId",
        select: "firstName middleName lastName email",
      },
    });
    await cycle[0].populate("createdBy", "firstName lastName email");

    await session.commitTransaction();

    return NextResponse.json(cycle[0], { status: 201 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Cycle creation transaction error:", err);

    // Handle duplicate key error
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        {
          error:
            "A cycle with this loan and cycle count already exists. Cycle counts are sequential and cannot be reused.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create cycle",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

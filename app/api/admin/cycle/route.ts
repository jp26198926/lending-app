import { NextRequest } from "next/server";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Cycle, { CycleStatus } from "@/models/Cycle";
import { withAuth } from "@/lib/apiAuth";
import "@/models/Loan";
import "@/models/User";

const PAGE_PATH = "/admin/cycle";
// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

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

    return corsResponse(request, cycles, 200);
  } catch (error) {
    console.error("Error fetching cycles:", error);
    return corsErrorResponse(request, { error: "Failed to fetch cycles" }, 500);
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
      return corsErrorResponse(request, {
          error:
            "Loan, cycle count, principal, interest rate, interest amount, total due, and due date are required",
        }, 400);
    }

    // Validate numeric values
    if (principal < 0) {
      await session.abortTransaction();
      return corsErrorResponse(request, { error: "Principal must be a positive number" }, 400);
    }

    if (interestRate < 0) {
      await session.abortTransaction();
      return corsErrorResponse(request, { error: "Interest rate must be a positive number" }, 400);
    }

    if (cycleCount < 1) {
      await session.abortTransaction();
      return corsErrorResponse(request, { error: "Cycle count must be at least 1" }, 400);
    }

    await connectDB();

    // Check for existing active cycle for this loan
    const existingActiveCycle = await Cycle.findOne({
      loanId,
      status: CycleStatus.ACTIVE,
    }).session(session);

    if (existingActiveCycle) {
      await session.abortTransaction();
      return corsErrorResponse(request, {
          error:
            "Cannot create a new cycle. An active cycle already exists for this loan. Please complete or cancel the existing cycle first.",
        }, 409);
    }

    // Check for previous expired cycle
    const previousExpiredCycle = await Cycle.findOne({
      loanId,
      status: CycleStatus.EXPIRED,
    })
      .sort({ createdAt: -1 }) // Get the most recent expired cycle
      .session(session);

    // Variables for the new cycle
    let newPrincipal = principal;
    let newInterestAmount = interestAmount;
    let newTotalDue = totalDue;
    let previousCycleRef = null;

    // If there's a previous expired cycle with a balance, use it as new principal
    if (previousExpiredCycle && previousExpiredCycle.balance > 0) {
      newPrincipal = previousExpiredCycle.balance;
      // Recalculate interest amount based on the new principal
      newInterestAmount = (newPrincipal * interestRate) / 100;
      // Recalculate total due
      newTotalDue = newPrincipal + newInterestAmount;
      // Store reference to previous cycle
      previousCycleRef = previousExpiredCycle._id;
    }

    // Auto-calculate derived fields
    const totalPaid = 0; // Initially no payments
    const balance = newTotalDue; // Initial balance is total due
    const profitExpected = newInterestAmount; // Expected profit is the interest
    const profitEarned = 0; // Initially no profit earned
    const profitRemaining = profitExpected; // Initially all profit remaining

    // Create cycle
    const cycle = await Cycle.create(
      [
        {
          loanId,
          cycleCount,
          principal: newPrincipal,
          interestRate,
          interestAmount: newInterestAmount,
          totalDue: newTotalDue,
          totalPaid,
          balance,
          profitExpected,
          profitEarned,
          profitRemaining,
          dateDue,
          createdBy: new mongoose.Types.ObjectId(user!.userId),
          status: status || CycleStatus.ACTIVE,
          previousCycleId: previousCycleRef,
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

    return corsResponse(request, cycle[0], 201);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Cycle creation transaction error:", err);

    // Handle duplicate key error
    if ((err as { code?: number }).code === 11000) {
      return corsErrorResponse(request, {
          error:
            "A cycle with this loan and cycle count already exists. Cycle counts are sequential and cannot be reused.",
        }, 409);
    }

    return corsErrorResponse(request, {
        error: "Failed to create cycle",
        details: err instanceof Error ? err.message : "Unknown error",
      }, 500);
  } finally {
    await session.endSession();
  }
}

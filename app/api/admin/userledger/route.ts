import { NextRequest } from "next/server";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import UserLedger, { UserLedgerStatus } from "@/models/UserLedger";
import { withAuth } from "@/lib/apiAuth";
import "@/models/User";
import "@/models/Loan";

const PAGE_PATH = "/admin/userledger";
// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

// GET - Fetch all user ledgers with optional filtering
export async function GET(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");
    const loanId = searchParams.get("loanId");

    // Build filter
    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (type) {
      filter.type = type;
    }

    if (loanId) {
      filter.loanId = loanId;
    }

    const userLedgers = await UserLedger.find(filter)
      .populate("userId", "firstName lastName email")
      .populate("loanId", "loanNo clientId principal interestRate status")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email")
      .sort({ date: -1, createdAt: -1 });

    return corsResponse(request, userLedgers, 200);
  } catch (error) {
    console.error("Error fetching user ledgers:", error);
    return corsErrorResponse(request, { error: "Failed to fetch user ledgers" }, 500);
  }
}

// POST - Create a new user ledger
export async function POST(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const body = await request.json();
    const { date, amount, type, userId, loanId, status } = body;

    // Validate required fields
    if (!date || amount === undefined || !type || !userId) {
      await session.abortTransaction();
      return corsErrorResponse(request, {
          error: "Date, amount, type, and user are required",
        }, 400);
    }

    // Validate numeric values
    if (amount < 0) {
      await session.abortTransaction();
      return corsErrorResponse(request, { error: "Amount must be a positive number" }, 400);
    }

    await connectDB();

    // Create user ledger
    const userLedger = await UserLedger.create(
      [
        {
          date,
          amount,
          type,
          userId,
          loanId: loanId || undefined,
          createdBy: new mongoose.Types.ObjectId(user!.userId),
          status: status || UserLedgerStatus.COMPLETED,
        },
      ],
      { session },
    );

    // Populate references for response
    await userLedger[0].populate("userId", "firstName lastName email");
    await userLedger[0].populate(
      "loanId",
      "loanNo clientId principal interestRate status",
    );
    await userLedger[0].populate("createdBy", "firstName lastName email");

    await session.commitTransaction();

    return corsResponse(request, userLedger[0], 201);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("User ledger creation transaction error:", err);
    return corsErrorResponse(request, {
        error: "Failed to create user ledger",
        details: err instanceof Error ? err.message : "Unknown error",
      }, 500);
  } finally {
    await session.endSession();
  }
}

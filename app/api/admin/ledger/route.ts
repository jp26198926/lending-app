import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Ledger, { LedgerStatus } from "@/models/Ledger";
import { withAuth } from "@/lib/apiAuth";
import "@/models/User";
import "@/models/Loan";
import "@/models/Cycle";
import "@/models/Payment";

const PAGE_PATH = "/admin/ledger";

// GET - Fetch all ledger entries with optional filtering
export async function GET(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const direction = searchParams.get("direction");
    const userId = searchParams.get("userId");
    const loanId = searchParams.get("loanId");
    const cycleId = searchParams.get("cycleId");
    const paymentId = searchParams.get("paymentId");

    // Build filter
    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    if (direction) {
      filter.direction = direction;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (loanId) {
      filter.loanId = loanId;
    }

    if (cycleId) {
      filter.cycleId = cycleId;
    }

    if (paymentId) {
      filter.paymentId = paymentId;
    }

    const ledgers = await Ledger.find(filter)
      .populate("userId", "firstName lastName email")
      .populate({
        path: "loanId",
        select: "loanNo clientId principal interestRate terms status",
        populate: {
          path: "clientId",
          select: "firstName middleName lastName email",
        },
      })
      .populate({
        path: "cycleId",
        select: "cycleCount totalDue balance dateDue status",
      })
      .populate({
        path: "paymentId",
        select: "paymentNo amount datePaid status",
      })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email")
      .sort({ date: -1, createdAt: -1 });

    return NextResponse.json(ledgers, { status: 200 });
  } catch (error) {
    console.error("Error fetching ledger entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch ledger entries" },
      { status: 500 },
    );
  }
}

// POST - Create a new ledger entry
export async function POST(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

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

    // Validate required fields
    if (!date || !type || !direction || amount === undefined) {
      await session.abortTransaction();
      return NextResponse.json(
        {
          error: "Date, type, direction, and amount are required",
        },
        { status: 400 },
      );
    }

    // Validate numeric values
    if (amount < 0) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 },
      );
    }

    await connectDB();

    // Create ledger entry
    const ledger = await Ledger.create(
      [
        {
          date,
          userId,
          type,
          direction,
          amount,
          loanId,
          cycleId,
          paymentId,
          description,
          createdBy: user._id,
          status: status || LedgerStatus.COMPLETED,
        },
      ],
      { session },
    );

    // Populate references for response
    await ledger[0].populate("userId", "firstName lastName email");
    await ledger[0].populate({
      path: "loanId",
      select: "loanNo clientId principal interestRate terms status",
      populate: {
        path: "clientId",
        select: "firstName middleName lastName email",
      },
    });
    await ledger[0].populate({
      path: "cycleId",
      select: "cycleCount totalDue balance dateDue status",
    });
    await ledger[0].populate({
      path: "paymentId",
      select: "paymentNo amount datePaid status",
    });
    await ledger[0].populate("createdBy", "firstName lastName email");

    await session.commitTransaction();

    return NextResponse.json(ledger[0], { status: 201 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Ledger creation transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to create ledger entry",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

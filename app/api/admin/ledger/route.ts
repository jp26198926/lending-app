import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Ledger, { LedgerStatus } from "@/models/Ledger";
import Settings from "@/models/Settings";
import User from "@/models/User";
import { withAuth } from "@/lib/apiAuth";
import "@/models/Loan";
import "@/models/Cycle";
import "@/models/Payment";

const PAGE_PATH = "/admin/ledger";

// GET - Fetch all ledger entries with optional filtering
export async function GET(request: NextRequest) {
  // Check authentication and permission
  const { error } = await withAuth(request, PAGE_PATH);
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
          userId: userId || undefined,
          type,
          direction,
          amount,
          loanId: loanId || undefined,
          cycleId: cycleId || undefined,
          paymentId: paymentId || undefined,
          description,
          createdBy: user!.userId,
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

    // Update cash on hand in settings
    const settings = await Settings.findOne().session(session);

    if (!settings) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Settings not found. Please configure settings first." },
        { status: 404 },
      );
    }

    // Calculate the change in cash on hand
    const cashChange = direction === "In" ? amount : -amount;
    const newCashOnHand = settings.cashOnHand + cashChange;

    // Prevent negative cash on hand
    if (newCashOnHand < 0) {
      await session.abortTransaction();
      return NextResponse.json(
        {
          error: "Insufficient cash on hand. Cannot complete this transaction.",
          currentBalance: settings.cashOnHand,
          requestedAmount: amount,
        },
        { status: 400 },
      );
    }

    // Update settings with new cash on hand
    await Settings.findByIdAndUpdate(
      settings._id,
      {
        $set: {
          cashOnHand: newCashOnHand,
          updatedBy: user!.userId,
          updatedAt: new Date(),
        },
      },
      { session },
    );

    // If Capital In with userId, update user's cashReceivable and capitalContribution
    let userUpdated = false;
    if (type === "Capital In" && userId) {
      const targetUser = await User.findById(userId).session(session);

      if (targetUser) {
        await User.findByIdAndUpdate(
          userId,
          {
            $inc: {
              cashReceivable: amount,
              capitalContribution: amount,
            },
            $set: {
              updatedBy: user!.userId,
              updatedAt: new Date(),
            },
          },
          { session },
        );
        userUpdated = true;
      }
    }

    await session.commitTransaction();

    return NextResponse.json(
      {
        ...ledger[0].toObject(),
        cashOnHandUpdated: {
          previous: settings.cashOnHand,
          change: cashChange,
          current: newCashOnHand,
        },
        ...(userUpdated && {
          userUpdated: {
            userId,
            cashReceivableAdded: amount,
            capitalContributionAdded: amount,
          },
        }),
      },
      { status: 201 },
    );
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

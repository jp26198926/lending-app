import { NextRequest } from "next/server";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Ledger, { LedgerStatus } from "@/models/Ledger";
import Settings from "@/models/Settings";
import User from "@/models/User";
import UserLedger, {
  UserLedgerType,
  UserLedgerStatus,
} from "@/models/UserLedger";
import { withAuth } from "@/lib/apiAuth";
import "@/models/Loan";
import "@/models/Cycle";
import "@/models/Payment";

const PAGE_PATH = "/admin/ledger";
// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

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
      .sort({ createdAt: -1 });

    return corsResponse(request, ledgers, 200);
  } catch (error) {
    console.error("Error fetching ledger entries:", error);
    return corsErrorResponse(
      request,
      { error: "Failed to fetch ledger entries" },
      500,
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
      return corsErrorResponse(
        request,
        {
          error: "Date, type, direction, and amount are required",
        },
        400,
      );
    }

    // Validate numeric values
    if (amount < 0) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Amount must be a positive number" },
        400,
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
          createdBy: new mongoose.Types.ObjectId(user!.userId),
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
      return corsErrorResponse(
        request,
        { error: "Settings not found. Please configure settings first." },
        404,
      );
    }

    // Calculate the change in cash on hand
    const cashChange = direction === "In" ? amount : -amount;
    const newCashOnHand = settings.cashOnHand + cashChange;

    // Prevent negative cash on hand
    if (newCashOnHand < 0) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        {
          error: "Insufficient cash on hand. Cannot complete this transaction.",
          details: `Current balance: ${settings.cashOnHand.toFixed(2)}, Requested amount: ${amount.toFixed(2)}`,
        },
        400,
      );
    }

    // Update settings with new cash on hand
    await Settings.findByIdAndUpdate(
      settings._id,
      {
        $set: {
          cashOnHand: newCashOnHand,
          updatedBy: new mongoose.Types.ObjectId(user!.userId),
          updatedAt: new Date(),
        },
      },
      { session },
    );

    // If Capital In with userId, update user's cashWithdrawable and capitalContribution
    let userUpdated = false;
    let userLedgerCreated = false;
    let userLedgerId = null;
    if (type === "Capital In" && userId) {
      const targetUser = await User.findById(userId).session(session);

      if (targetUser) {
        await User.findByIdAndUpdate(
          userId,
          {
            $inc: {
              cashWithdrawable: amount,
              capitalContribution: amount,
            },
            $set: {
              updatedBy: new mongoose.Types.ObjectId(user!.userId),
              updatedAt: new Date(),
            },
          },
          { session },
        );
        userUpdated = true;

        // Create UserLedger entry
        const userLedgerEntry = await UserLedger.create(
          [
            {
              date,
              amount,
              type: UserLedgerType.CAPITAL_IN,
              userId,
              loanId: loanId || undefined,
              createdBy: new mongoose.Types.ObjectId(user!.userId),
              status: UserLedgerStatus.COMPLETED,
            },
          ],
          { session },
        );
        userLedgerCreated = true;
        userLedgerId = userLedgerEntry[0]._id;
      }
    }

    await session.commitTransaction();

    return corsResponse(
      request,
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
            cashWithdrawableAdded: amount,
            capitalContributionAdded: amount,
            userLedgerCreated,
            userLedgerId,
          },
        }),
      },
      201,
    );
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Ledger creation transaction error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to create ledger entry",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    await session.endSession();
  }
}

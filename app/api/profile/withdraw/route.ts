import { NextRequest } from "next/server";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import User from "@/models/User";
import UserLedger, {
  UserLedgerType,
  UserLedgerStatus,
} from "@/models/UserLedger";
import Ledger, {
  LedgerType,
  LedgerDirection,
  LedgerStatus,
} from "@/models/Ledger";
import Settings from "@/models/Settings";

// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

export async function POST(request: NextRequest) {
  // 1. Authentication check (no permission needed for user's own withdrawal)
  const currentUser = await getCurrentUser(request);
  if (!currentUser) {
    return corsErrorResponse(
      request,
      { error: "Authentication required" },
      401,
    );
  }

  // 2. Start session for transaction
  const session = await mongoose.startSession();

  try {
    // 3. Start transaction
    await session.startTransaction();

    // 4. Parse and validate input
    const body = await request.json();
    const { amount } = body;

    // Basic validation
    if (!amount || amount <= 0) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Valid withdrawal amount is required" },
        400,
      );
    }

    // 5. Connect to database
    await connectDB();

    // 6. Get user's current balance
    const user = await User.findOne({
      _id: currentUser.userId,
      status: "ACTIVE",
    }).session(session);

    if (!user) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "User not found or inactive" },
        404,
      );
    }

    // 7. Check if user has sufficient balance
    const currentCashWithdrawable = user.cashWithdrawable || 0;
    if (currentCashWithdrawable < amount) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        {
          error: "Insufficient balance",
          details: `Available: ${currentCashWithdrawable.toFixed(2)}, Requested: ${amount.toFixed(2)}`,
        },
        400,
      );
    }

    // 8. Update user's financial fields
    const updatedUser = await User.findByIdAndUpdate(
      currentUser.userId,
      {
        $inc: {
          cashWithdrawable: -amount, // Deduct from withdrawable
          totalWithdrawn: amount, // Add to total withdrawn
        },
        $set: {
          updatedBy: currentUser.userId,
          updatedAt: new Date(),
        },
      },
      {
        new: true,
        session,
        runValidators: true,
      },
    );

    // 9. Create UserLedger entry
    const withdrawalDate = new Date();
    const userLedgerEntry = await UserLedger.create(
      [
        {
          date: withdrawalDate,
          amount,
          type: UserLedgerType.WITHDRAWAL,
          userId: currentUser.userId,
          status: UserLedgerStatus.COMPLETED,
          createdBy: currentUser.userId,
          createdAt: new Date(),
        },
      ],
      { session },
    );

    // 10. Create Ledger entry
    const ledgerEntry = await Ledger.create(
      [
        {
          date: withdrawalDate,
          userId: currentUser.userId,
          type: LedgerType.WITHDRAWAL,
          direction: LedgerDirection.OUT,
          amount,
          description: `Withdrawal by ${user.firstName} ${user.lastName}`,
          status: LedgerStatus.COMPLETED,
          createdBy: currentUser.userId,
          createdAt: new Date(),
        },
      ],
      { session },
    );

    // 11. Update Settings - deduct from cashOnHand
    const settings = await Settings.findOne({}).session(session);

    if (!settings) {
      await session.abortTransaction();
      return corsErrorResponse(request, { error: "Settings not found" }, 404);
    }

    // Check if settings has sufficient cashOnHand
    if (settings.cashOnHand < amount) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        {
          error: "Insufficient cash on hand in settings",
          details: `Available: ${settings.cashOnHand.toFixed(2)}, Required: ${amount.toFixed(2)}`,
        },
        400,
      );
    }

    // Deduct from cashOnHand
    await Settings.findByIdAndUpdate(
      settings._id,
      {
        $inc: {
          cashOnHand: -amount, // Deduct withdrawal amount
        },
        $set: {
          updatedBy: currentUser.userId,
          updatedAt: new Date(),
        },
      },
      {
        session,
        runValidators: true,
      },
    );

    // 12. Commit transaction
    await session.commitTransaction();

    // 13. Return success response
    return corsResponse(
      request,
      {
        message: "Withdrawal successful",
        data: {
          amount,
          newCashWithdrawable: updatedUser?.cashWithdrawable || 0,
          newTotalWithdrawn: updatedUser?.totalWithdrawn || 0,
          userLedgerId: userLedgerEntry[0]._id,
          ledgerId: ledgerEntry[0]._id,
        },
      },
      201,
    );
  } catch (err: unknown) {
    // 14. Rollback on error
    await session.abortTransaction();

    console.error("Withdrawal transaction error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to process withdrawal",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    // 15. Always end session
    await session.endSession();
  }
}

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import UserLedger from "@/models/UserLedger";
import { getCurrentUser } from "@/lib/auth";
import "@/models/User";
import "@/models/Loan";

/**
 * GET /api/profile/userledger
 * Get current logged in user's ledger records
 * No transactions needed - read-only operation
 * No page permissions required - users can view their own ledger
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user from token
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 },
      );
    }

    // Connect to database
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    // Build filter - always filter by current user
    const filter: Record<string, unknown> = {
      userId: currentUser.userId,
    };

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    // Fetch user ledgers
    const userLedgers = await UserLedger.find(filter)
      .populate("userId", "firstName lastName email")
      .populate("loanId", "loanNo clientId principal interestRate status")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .sort({ date: -1, createdAt: -1 });

    return NextResponse.json(userLedgers, { status: 200 });
  } catch (err: unknown) {
    console.error("User ledger fetch error:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch user ledgers",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

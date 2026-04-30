import { NextRequest } from "next/server";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";
import connectDB from "@/lib/mongodb";
import UserLedger from "@/models/UserLedger";
import { getCurrentUser } from "@/lib/auth";
import "@/models/User";
import "@/models/Loan";

// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

/**
 * GET /api/profile/userledger
 * Get current logged in user's ledger records
 * No transactions needed - read-only operation
 * No page permissions required - users can view their own ledger
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user from token (cookie for web, Authorization header for mobile)
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return corsErrorResponse(
        request,
        { error: "Unauthorized - Please log in" },
        401,
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

    return corsResponse(request, userLedgers, 200);
  } catch (err: unknown) {
    console.error("User ledger fetch error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to fetch user ledgers",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  }
}

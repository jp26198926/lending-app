import { NextRequest } from "next/server";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";

// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

/**
 * GET /api/profile
 * Get current logged in user's profile
 * No transactions needed - read-only operation
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

    // Fetch user details with role populated
    const user = await User.findOne({
      _id: currentUser.userId,
      status: { $ne: "DELETED" },
    })
      .populate("roleId", "role")
      .select("-password") // Exclude password field
      .lean();

    if (!user) {
      return corsErrorResponse(
        request,
        { error: "User not found or inactive" },
        404,
      );
    }

    return corsResponse(
      request,
      {
        message: "Profile retrieved successfully",
        data: user,
      },
      200,
    );
  } catch (err: unknown) {
    console.error("Profile fetch error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to fetch profile",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  }
}

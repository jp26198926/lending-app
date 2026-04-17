import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/profile
 * Get current logged in user's profile
 * No transactions needed - read-only operation
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

    // Fetch user details with role populated
    const user = await User.findOne({
      _id: currentUser.userId,
      status: { $ne: "DELETED" },
    })
      .populate("roleId", "role")
      .select("-password") // Exclude password field
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "User not found or inactive" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Profile retrieved successfully",
      data: user,
    });
  } catch (err: unknown) {
    console.error("Profile fetch error:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch profile",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

import { NextRequest } from "next/server";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";

// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

/**
 * POST /api/profile/change-password
 * Change current logged in user's password
 * Requires old password verification
 */
export async function POST(request: NextRequest) {
  const session = await mongoose.startSession();

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

    await session.startTransaction();

    const body = await request.json();
    const { oldPassword, newPassword, confirmPassword } = body;

    // Validate input
    if (!oldPassword) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Current password is required" },
        400,
      );
    }

    if (!newPassword) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "New password is required" },
        400,
      );
    }

    if (newPassword.length < 6) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "New password must be at least 6 characters long" },
        400,
      );
    }

    if (newPassword !== confirmPassword) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "New password and confirmation do not match" },
        400,
      );
    }

    if (oldPassword === newPassword) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "New password must be different from current password" },
        400,
      );
    }

    // Connect to database
    await connectDB();

    // Find the user
    const user = await User.findOne({
      _id: currentUser.userId,
      status: { $ne: "DELETED" },
    }).session(session);

    if (!user) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "User not found or inactive" },
        404,
      );
    }

    // Verify old password
    const isPasswordValid = await user.comparePassword(oldPassword);

    if (!isPasswordValid) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Current password is incorrect" },
        401,
      );
    }

    // Update password
    user.password = newPassword;
    user.updatedBy = currentUser.userId;
    user.updatedAt = new Date();

    await user.save({ session });

    await session.commitTransaction();

    return corsResponse(
      request,
      {
        message: "Password changed successfully",
      },
      200,
    );
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Password change error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to change password",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    await session.endSession();
  }
}

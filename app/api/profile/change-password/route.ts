import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";

/**
 * POST /api/profile/change-password
 * Change current logged in user's password
 * Requires old password verification
 */
export async function POST(request: NextRequest) {
  const session = await mongoose.startSession();

  try {
    // Get current user from token
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 },
      );
    }

    await session.startTransaction();

    const body = await request.json();
    const { oldPassword, newPassword, confirmPassword } = body;

    // Validate input
    if (!oldPassword) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Current password is required" },
        { status: 400 },
      );
    }

    if (!newPassword) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "New password and confirmation do not match" },
        { status: 400 },
      );
    }

    if (oldPassword === newPassword) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 },
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
      return NextResponse.json(
        { error: "User not found or inactive" },
        { status: 404 },
      );
    }

    // Verify old password
    const isPasswordValid = await user.comparePassword(oldPassword);

    if (!isPasswordValid) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 },
      );
    }

    // Update password
    user.password = newPassword;
    user.updatedBy = currentUser.userId;
    user.updatedAt = new Date();

    await user.save({ session });

    await session.commitTransaction();

    return NextResponse.json({
      message: "Password changed successfully",
    });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Password change error:", err);
    return NextResponse.json(
      {
        error: "Failed to change password",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

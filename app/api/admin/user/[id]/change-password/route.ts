import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { checkAuth } from "@/lib/apiAuth";

// POST - Change user password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication (users can change their own password or admins can change any)
  const authResult = await checkAuth();

  if (!authResult.isValid || !authResult.user) {
    return NextResponse.json(
      { error: authResult.error?.message || "Unauthorized" },
      { status: authResult.error?.status || 401 },
    );
  }

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { id } = await params;
    const body = await request.json();

    const { oldPassword, newPassword } = body;

    // Validate input - newPassword is required, oldPassword is optional (for admin override)
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

    await connectDB();

    // Find the user
    const user = await User.findById(id).session(session);

    if (!user) {
      await session.abortTransaction();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify old password only if provided
    if (oldPassword) {
      const isPasswordValid = await user.comparePassword(oldPassword);

      if (!isPasswordValid) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 },
        );
      }
    }

    // Update password
    user.password = newPassword;
    user.updatedBy = new mongoose.Types.ObjectId(authResult.user!.userId);
    user.updatedAt = new Date();

    await user.save({ session });

    await session.commitTransaction();

    return NextResponse.json(
      { message: "Password changed successfully" },
      { status: 200 },
    );
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Password change transaction error:", err);
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

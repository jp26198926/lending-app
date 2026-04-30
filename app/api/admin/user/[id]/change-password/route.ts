import { NextRequest } from "next/server";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { checkAuth } from "@/lib/apiAuth";

// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

// POST - Change user password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication (users can change their own password or admins can change any)
  const authResult = await checkAuth();

  if (!authResult.isValid || !authResult.user) {
    return corsErrorResponse(
      request,
      { error: authResult.error?.message || "Unauthorized" },
      authResult.error?.status || 401,
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

    await connectDB();

    // Find the user
    const user = await User.findById(id).session(session);

    if (!user) {
      await session.abortTransaction();
      return corsErrorResponse(request, { error: "User not found" }, 404);
    }

    // Verify old password only if provided
    if (oldPassword) {
      const isPasswordValid = await user.comparePassword(oldPassword);

      if (!isPasswordValid) {
        await session.abortTransaction();
        return corsErrorResponse(
          request,
          { error: "Current password is incorrect" },
          401,
        );
      }
    }

    // Update password
    user.password = newPassword;
    user.updatedBy = new mongoose.Types.ObjectId(authResult.user!.userId);
    user.updatedAt = new Date();

    await user.save({ session });

    await session.commitTransaction();

    return corsResponse(
      request,
      { message: "Password changed successfully" },
      200,
    );
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Password change transaction error:", err);
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

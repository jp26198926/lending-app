import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import User, { UserStatus } from "@/models/User";
import { withAuth } from "@/lib/apiAuth";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";
import "@/models/Role";

const PAGE_PATH = "/admin/user";

// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

// GET - Fetch single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    const user = await User.findOne({
      _id: id,
      // status: { $ne: UserStatus.DELETED },
    })
      .populate("roleId", "role status")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .select("-password")
      .lean();

    if (!user) {
      return corsErrorResponse(request, { error: "User not found" }, 404);
    }

    return corsResponse(request, user, 200);
  } catch (error) {
    console.error("Error fetching user:", error);
    return corsErrorResponse(request, { error: "Failed to fetch user" }, 500);
  }
}

// PUT - Update user by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { id } = await params;
    const body = await request.json();

    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      roleId,
      rate,
      cashWithdrawable,
      capitalContribution,
      profitEarned,
      totalWithdrawn,
      status,
    } = body;

    await connectDB();

    // Find the user
    const existingUser = await User.findById(id).session(session);

    if (!existingUser) {
      await session.abortTransaction();
      return corsErrorResponse(request, { error: "User not found" }, 404);
    }

    // Check if email is being changed and if it conflicts with another user
    if (email && email.toLowerCase().trim() !== existingUser.email) {
      const duplicateUser = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: id },
        // status: { $ne: UserStatus.DELETED },
      }).session(session);

      if (duplicateUser) {
        await session.abortTransaction();
        return corsErrorResponse(
          request,
          { error: "User with this email already exists" },
          409,
        );
      }
    }

    // Update fields
    if (email) existingUser.email = email.toLowerCase().trim();
    if (password) existingUser.password = password;
    if (firstName) existingUser.firstName = firstName.trim();
    if (lastName) existingUser.lastName = lastName.trim();
    if (phone) existingUser.phone = phone.trim();
    if (roleId) existingUser.roleId = roleId;
    if (rate !== undefined) existingUser.rate = rate;
    if (cashWithdrawable !== undefined)
      existingUser.cashWithdrawable = cashWithdrawable;
    if (capitalContribution !== undefined)
      existingUser.capitalContribution = capitalContribution;
    if (profitEarned !== undefined) existingUser.profitEarned = profitEarned;
    if (totalWithdrawn !== undefined)
      existingUser.totalWithdrawn = totalWithdrawn;
    existingUser.updatedBy = new mongoose.Types.ObjectId(user!.userId);
    existingUser.updatedAt = new Date();
    if (status) existingUser.status = status;

    await existingUser.save({ session });

    // Populate and return without password
    const updatedUser = await User.findById(id)
      .populate("roleId", "role status")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .select("-password")
      .session(session);

    await session.commitTransaction();

    return corsResponse(request, updatedUser, 200);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("User update transaction error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to update user",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    await session.endSession();
  }
}

// DELETE - Soft delete user by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim() === "") {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Deletion reason is required" },
        400,
      );
    }

    await connectDB();

    const existingUser = await User.findById(id).session(session);

    if (!existingUser) {
      await session.abortTransaction();
      return corsErrorResponse(request, { error: "User not found" }, 404);
    }

    // Soft delete
    existingUser.status = UserStatus.DELETED;
    existingUser.deletedAt = new Date();
    existingUser.deletedBy = new mongoose.Types.ObjectId(user!.userId);
    existingUser.deletedReason = reason;

    await existingUser.save({ session });

    // Populate and return without password
    const deletedUser = await User.findById(id)
      .populate("roleId", "role status")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email")
      .select("-password")
      .session(session);

    await session.commitTransaction();

    return corsResponse(request, deletedUser, 200);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("User deletion transaction error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to delete user",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    await session.endSession();
  }
}

// PATCH - Activate user by ID (opposite of soft delete)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission (using Edit permission)
  const { user, error } = await withAuth(request, PAGE_PATH, "Edit");
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { id } = await params;

    await connectDB();

    const existingUser = await User.findById(id).session(session);

    if (!existingUser) {
      await session.abortTransaction();
      return corsErrorResponse(request, { error: "User not found" }, 404);
    }

    // Activate the user
    existingUser.status = UserStatus.ACTIVE;
    existingUser.deletedAt = null;
    existingUser.deletedBy = null;
    existingUser.deletedReason = null;
    existingUser.updatedBy = new mongoose.Types.ObjectId(user!.userId);
    existingUser.updatedAt = new Date();

    await existingUser.save({ session });

    // Populate and return without password
    const activatedUser = await User.findById(id)
      .populate("roleId", "role status")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .select("-password")
      .session(session);

    await session.commitTransaction();

    return corsResponse(request, activatedUser, 200);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("User activation transaction error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to activate user",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    await session.endSession();
  }
}

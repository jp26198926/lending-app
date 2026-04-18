import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import User, { UserStatus } from "@/models/User";
import { withAuth } from "@/lib/apiAuth";
import "@/models/Role";

const PAGE_PATH = "/admin/user";

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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 },
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
    existingUser.updatedBy = user._id;
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

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("User update transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to update user",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
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
      return NextResponse.json(
        { error: "Deletion reason is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const existingUser = await User.findById(id).session(session);

    if (!existingUser) {
      await session.abortTransaction();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Soft delete
    existingUser.status = UserStatus.DELETED;
    existingUser.deletedAt = new Date();
    existingUser.deletedBy = user._id;
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

    return NextResponse.json(deletedUser, { status: 200 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("User deletion transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to delete user",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Activate the user
    existingUser.status = UserStatus.ACTIVE;
    existingUser.deletedAt = null;
    existingUser.deletedBy = null;
    existingUser.deletedReason = null;
    existingUser.updatedBy = user._id;
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

    return NextResponse.json(activatedUser, { status: 200 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("User activation transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to activate user",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

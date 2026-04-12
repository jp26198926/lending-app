import { NextRequest, NextResponse } from "next/server";
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

  try {
    await connectDB();
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
      cashReceivable,
      capitalContribution,
      profitEarned,
      updatedBy,
      status,
    } = body;

    // Find the user
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if email is being changed and if it conflicts with another user
    if (email && email.toLowerCase().trim() !== user.email) {
      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: id },
        // status: { $ne: UserStatus.DELETED },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 },
        );
      }
    }

    // Update fields
    if (email) user.email = email.toLowerCase().trim();
    if (password) user.password = password;
    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (phone) user.phone = phone.trim();
    if (roleId) user.roleId = roleId;
    if (rate !== undefined) user.rate = rate;
    if (cashReceivable !== undefined) user.cashReceivable = cashReceivable;
    if (capitalContribution !== undefined)
      user.capitalContribution = capitalContribution;
    if (profitEarned !== undefined) user.profitEarned = profitEarned;
    if (updatedBy) user.updatedBy = updatedBy;
    if (status) user.status = status;

    await user.save();

    // Populate and return without password
    const updatedUser = await User.findById(id)
      .populate("roleId", "role status")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .select("-password");

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
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

  try {
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deletedBy = searchParams.get("deletedBy");
    const deletedReason = searchParams.get("deletedReason");

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Soft delete
    user.status = UserStatus.DELETED;
    user.deletedAt = new Date();
    if (deletedBy) user.deletedBy = deletedBy;
    if (deletedReason) user.deletedReason = deletedReason;

    await user.save();

    // Populate and return without password
    const deletedUser = await User.findById(id)
      .populate("roleId", "role status")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email")
      .select("-password");

    return NextResponse.json(deletedUser, { status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
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

  try {
    await connectDB();
    const { id } = await params;

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Activate the user
    user.status = UserStatus.ACTIVE;
    user.deletedAt = null;
    user.deletedBy = null;
    user.deletedReason = null;

    await user.save();

    // Populate and return without password
    const activatedUser = await User.findById(id)
      .populate("roleId", "role status")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .select("-password");

    return NextResponse.json(activatedUser, { status: 200 });
  } catch (error) {
    console.error("Error activating user:", error);
    return NextResponse.json(
      { error: "Failed to activate user" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
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

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const { oldPassword, newPassword, updatedBy } = body;

    // Validate input
    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: "Old password and new password are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 },
      );
    }

    // Find the user
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify old password
    const isPasswordValid = await user.comparePassword(oldPassword);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 },
      );
    }

    // Update password
    user.password = newPassword;
    if (updatedBy) user.updatedBy = updatedBy;

    await user.save();

    return NextResponse.json(
      { message: "Password changed successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 },
    );
  }
}

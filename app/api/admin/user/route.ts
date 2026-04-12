import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User, { UserStatus } from "@/models/User";
import { withAuth } from "@/lib/apiAuth";
import "@/models/Role";

const PAGE_PATH = "/admin/user";

// GET - Fetch all users with optional filtering
export async function GET(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const email = searchParams.get("email");
    const roleId = searchParams.get("roleId");

    // Build filter
    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    } else {
      // By default, exclude DELETED users
      filter.status = { $ne: UserStatus.DELETED };
    }

    if (email) {
      filter.email = { $regex: email, $options: "i" };
    }

    if (roleId) {
      filter.roleId = roleId;
    }

    const users = await User.find(filter)
      .populate("roleId", "role status")
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .select("-password"); // Exclude password from response

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await connectDB();

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
      createdBy,
      status,
    } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phone || !roleId) {
      return NextResponse.json(
        {
          error:
            "Email, password, firstName, lastName, phone, and roleId are required",
        },
        { status: 400 },
      );
    }

    // Check if user with the same email already exists (excluding DELETED)
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
      status: { $ne: UserStatus.DELETED },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Create new user
    const newUser = await User.create({
      email: email.toLowerCase().trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      roleId,
      rate: rate || 0,
      cashReceivable: cashReceivable || 0,
      capitalContribution: capitalContribution || 0,
      profitEarned: profitEarned || 0,
      createdBy: createdBy || null,
      status: status || UserStatus.ACTIVE,
    });

    // Populate and return without password
    const populatedUser = await User.findById(newUser._id)
      .populate("roleId", "role status")
      .populate("createdBy", "firstName lastName email")
      .select("-password");

    return NextResponse.json(populatedUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}

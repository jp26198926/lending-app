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
    const firstName = searchParams.get("firstName");
    const lastName = searchParams.get("lastName");
    const phone = searchParams.get("phone");
    const roleId = searchParams.get("roleId");
    const role = searchParams.get("role");

    // Build filter
    const filter: Record<string, unknown> = {};

    // if (status) {
    //   filter.status = { $regex: status, $options: "i" };
    // } else {
    //   // By default, exclude DELETED users
    //   filter.status = { $ne: UserStatus.DELETED };
    // }

    if (email) {
      filter.email = { $regex: email, $options: "i" };
    }

    if (firstName) {
      filter.firstName = { $regex: firstName, $options: "i" };
    }

    if (lastName) {
      filter.lastName = { $regex: lastName, $options: "i" };
    }

    if (phone) {
      filter.phone = { $regex: phone, $options: "i" };
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

    return corsResponse(request, users, 200);
  } catch (error) {
    console.error("Error fetching users:", error);
    return corsErrorResponse(request, { error: "Failed to fetch users" }, 500);
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

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

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phone || !roleId) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        {
          error:
            "Email, password, firstName, lastName, phone, and roleId are required",
        },
        400,
      );
    }

    await connectDB();

    // Check if user with the same email already exists (excluding DELETED)
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
      // status: { $ne: UserStatus.DELETED },
    }).session(session);

    if (existingUser) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "User with this email already exists" },
        409,
      );
    }

    // Create new user with transaction
    const newUser = await User.create(
      [
        {
          email: email.toLowerCase().trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          roleId,
          rate: rate || 0,
          cashWithdrawable: cashWithdrawable || 0,
          capitalContribution: capitalContribution || 0,
          profitEarned: profitEarned || 0,
          totalWithdrawn: totalWithdrawn || 0,
          createdBy: new mongoose.Types.ObjectId(user!.userId),
          status: status || UserStatus.ACTIVE,
        },
      ],
      { session },
    );

    // Populate and return without password
    const populatedUser = await User.findById(newUser[0]._id)
      .populate("roleId", "role status")
      .populate("createdBy", "firstName lastName email")
      .select("-password")
      .session(session);

    await session.commitTransaction();

    return corsResponse(request, populatedUser, 201);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("User creation transaction error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to create user",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    await session.endSession();
  }
}

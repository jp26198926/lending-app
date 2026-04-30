import { NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Role, { RoleStatus } from "@/models/Role";
import { withAuth } from "@/lib/apiAuth";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";

const PAGE_PATH = "/admin/role";

// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

// GET - Fetch all active roles
export async function GET(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const role = searchParams.get("role");

    // Build filter
    const filter: Record<string, unknown> = {};

    // if (status) {
    //   filter.status = { $regex: status, $options: "i" };
    // } else {
    //   // By default, show only ACTIVE roles
    //   filter.status = RoleStatus.ACTIVE;
    // }

    if (role) {
      filter.role = { $regex: role, $options: "i" };
    }

    const records = await Role.find(filter).sort({ createdAt: 1 }).lean();
    return corsResponse(request, records, 200);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return corsErrorResponse(request, { error: "Failed to fetch roles" }, 500);
  }
}

// POST - Create new role
export async function POST(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const body = await request.json();

    if (!body.role || body.role.trim() === "") {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Role name is required" },
        400,
      );
    }

    await dbConnect();

    // Check for duplicate
    const existingRole = await Role.findOne({
      role: body.role,
    }).session(session);

    if (existingRole) {
      await session.abortTransaction();
      return corsErrorResponse(request, { error: "Role already exists" }, 409);
    }

    const newRecord = await Role.create(
      [
        {
          role: body.role,
          createdBy: new mongoose.Types.ObjectId(user!.userId),
          status: RoleStatus.ACTIVE,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return corsResponse(request, newRecord[0], 201);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Role creation transaction error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to create role",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    await session.endSession();
  }
}

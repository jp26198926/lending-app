import { NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Permission, { PermissionStatus } from "@/models/Permission";
import { withAuth } from "@/lib/apiAuth";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";

const PAGE_PATH = "/admin/permission";

// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

// GET - Fetch all records (excluding soft deleted)
export async function GET(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const permission = searchParams.get("permission");

    // Build filter
    const filter: Record<string, unknown> = {};

    // if (status) {
    //   filter.status = { $regex: status, $options: "i" };
    // } else {
    //   // By default, show only ACTIVE permissions
    //   filter.status = PermissionStatus.ACTIVE;
    // }

    if (permission) {
      filter.permission = { $regex: permission, $options: "i" };
    }

    const records = await Permission.find(filter).sort({ createdAt: 1 }).lean();
    return corsResponse(request, records, 200);
  } catch (error) {
    console.error("Error fetching records:", error);
    return corsErrorResponse(
      request,
      { error: "Failed to fetch records" },
      500,
    );
  }
}

// POST - Create new record
export async function POST(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const body = await request.json();

    if (!body.permission || body.permission.trim() === "") {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Permission name is required" },
        400,
      );
    }

    await dbConnect();

    // Check for duplicate
    const existingPermission = await Permission.findOne({
      permission: body.permission,
    }).session(session);

    if (existingPermission) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Permission already exists" },
        409,
      );
    }

    const newRecord = await Permission.create(
      [
        {
          permission: body.permission,
          status: PermissionStatus.ACTIVE,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return corsResponse(request, newRecord[0], 201);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Permission creation transaction error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to create record",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    await session.endSession();
  }
}

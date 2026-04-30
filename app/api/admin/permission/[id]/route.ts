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

// GET - Fetch single permission by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await dbConnect();
    const { id } = await params;

    const record = await Permission.findOne({
      _id: id,
      // status: PermissionStatus.ACTIVE,
    }).lean();

    if (!record) {
      return corsErrorResponse(request, { error: "Permission not found" }, 404);
    }

    return corsResponse(request, record, 200);
  } catch (error) {
    console.error("Error fetching permission:", error);
    return corsErrorResponse(
      request,
      { error: "Failed to fetch permission" },
      500,
    );
  }
}

// PUT - Update permission by ID
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

    if (!body.permission || body.permission.trim() === "") {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Permission name is required" },
        400,
      );
    }

    await dbConnect();

    // Find existing permission
    const existingPermission = await Permission.findById(id).session(session);

    if (!existingPermission) {
      await session.abortTransaction();
      return corsErrorResponse(request, { error: "Permission not found" }, 404);
    }

    // Check for duplicate (excluding current permission)
    const duplicatePermission = await Permission.findOne({
      permission: body.permission,
      _id: { $ne: id },
    }).session(session);

    if (duplicatePermission) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Permission already exists" },
        409,
      );
    }

    existingPermission.permission = body.permission;
    existingPermission.updatedAt = new Date();

    await existingPermission.save({ session });

    await session.commitTransaction();

    return corsResponse(request, existingPermission, 200);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Permission update transaction error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to update permission",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    await session.endSession();
  }
}

// DELETE - Soft delete permission by ID
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

    await dbConnect();

    const existingPermission = await Permission.findById(id).session(session);

    if (!existingPermission) {
      await session.abortTransaction();
      return corsErrorResponse(request, { error: "Permission not found" }, 404);
    }

    existingPermission.status = PermissionStatus.DELETED;
    existingPermission.deletedAt = new Date();
    existingPermission.deletedBy = new mongoose.Types.ObjectId(user!.userId);
    existingPermission.deletedReason = reason;

    await existingPermission.save({ session });

    await session.commitTransaction();

    return corsResponse(request, existingPermission, 200);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Permission deletion transaction error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to delete permission",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    await session.endSession();
  }
}

// PATCH - Activate permission by ID (opposite of soft delete)
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

    await dbConnect();

    const existingPermission = await Permission.findById(id).session(session);

    if (!existingPermission) {
      await session.abortTransaction();
      return corsErrorResponse(request, { error: "Permission not found" }, 404);
    }

    existingPermission.status = PermissionStatus.ACTIVE;
    existingPermission.deletedAt = null;
    existingPermission.deletedBy = null;
    existingPermission.deletedReason = null;
    existingPermission.updatedAt = new Date();

    await existingPermission.save({ session });

    await session.commitTransaction();

    return corsResponse(request, existingPermission, 200);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Permission activation transaction error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to activate permission",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    await session.endSession();
  }
}

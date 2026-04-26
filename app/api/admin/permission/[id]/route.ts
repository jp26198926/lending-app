import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Permission, { PermissionStatus } from "@/models/Permission";
import { withAuth } from "@/lib/apiAuth";

const PAGE_PATH = "/admin/permission";

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
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error("Error fetching permission:", error);
    return NextResponse.json(
      { error: "Failed to fetch permission" },
      { status: 500 },
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
      return NextResponse.json(
        { error: "Permission name is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Find existing permission
    const existingPermission = await Permission.findById(id).session(session);

    if (!existingPermission) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 },
      );
    }

    // Check for duplicate (excluding current permission)
    const duplicatePermission = await Permission.findOne({
      permission: body.permission,
      _id: { $ne: id },
    }).session(session);

    if (duplicatePermission) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Permission already exists" },
        { status: 409 },
      );
    }

    existingPermission.permission = body.permission;
    existingPermission.updatedAt = new Date();

    await existingPermission.save({ session });

    await session.commitTransaction();

    return NextResponse.json(existingPermission);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Permission update transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to update permission",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
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
      return NextResponse.json(
        { error: "Deletion reason is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    const existingPermission = await Permission.findById(id).session(session);

    if (!existingPermission) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 },
      );
    }

    existingPermission.status = PermissionStatus.DELETED;
    existingPermission.deletedAt = new Date();
    existingPermission.deletedBy = new mongoose.Types.ObjectId(user!.userId);
    existingPermission.deletedReason = reason;

    await existingPermission.save({ session });

    await session.commitTransaction();

    return NextResponse.json(existingPermission);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Permission deletion transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to delete permission",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
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
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 },
      );
    }

    existingPermission.status = PermissionStatus.ACTIVE;
    existingPermission.deletedAt = null;
    existingPermission.deletedBy = null;
    existingPermission.deletedReason = null;
    existingPermission.updatedAt = new Date();

    await existingPermission.save({ session });

    await session.commitTransaction();

    return NextResponse.json(existingPermission);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Permission activation transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to activate permission",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

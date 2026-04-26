import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import RolePermission, { RolePermissionStatus } from "@/models/RolePermission";
import { withAuth } from "@/lib/apiAuth";
import "@/models/Role";
import "@/models/Page";
import "@/models/Permission";

const PAGE_PATH = "/admin/rolepermission";

// GET - Fetch single role-permission assignment by ID
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

    const record = await RolePermission.findOne({
      _id: id,
      // status: RolePermissionStatus.ACTIVE,
    })
      .populate("roleId", "role status")
      .populate("pageId", "page path status")
      .populate("permissionId", "permission status")
      .lean();

    if (!record) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error("Error fetching role-permission assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch role-permission assignment" },
      { status: 500 },
    );
  }
}

// PUT - Update role-permission assignment by ID
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

    await dbConnect();

    // Find existing assignment
    const existingAssignment =
      await RolePermission.findById(id).session(session);

    if (!existingAssignment) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    // Check for duplicate if IDs are being changed
    if (body.roleId || body.pageId || body.permissionId) {
      const duplicateAssignment = await RolePermission.findOne({
        roleId: body.roleId || existingAssignment.roleId,
        pageId: body.pageId || existingAssignment.pageId,
        permissionId: body.permissionId || existingAssignment.permissionId,
        _id: { $ne: id },
      }).session(session);

      if (duplicateAssignment) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: "This role-page-permission assignment already exists" },
          { status: 409 },
        );
      }
    }

    // Update fields
    if (body.roleId) existingAssignment.roleId = body.roleId;
    if (body.pageId) existingAssignment.pageId = body.pageId;
    if (body.permissionId) existingAssignment.permissionId = body.permissionId;
    existingAssignment.updatedBy = new mongoose.Types.ObjectId(user!.userId);
    existingAssignment.updatedAt = new Date();

    await existingAssignment.save({ session });

    // Populate before returning
    const updatedRecord = await RolePermission.findById(id)
      .populate("roleId", "role status")
      .populate("pageId", "page path status")
      .populate("permissionId", "permission status")
      .session(session);

    await session.commitTransaction();

    return NextResponse.json(updatedRecord);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("RolePermission update transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to update role-permission assignment",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

// DELETE - Soft delete role-permission assignment by ID
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

    const existingAssignment =
      await RolePermission.findById(id).session(session);

    if (!existingAssignment) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    existingAssignment.status = RolePermissionStatus.DELETED;
    existingAssignment.deletedAt = new Date();
    existingAssignment.deletedBy = new mongoose.Types.ObjectId(user!.userId);
    existingAssignment.deletedReason = reason;

    await existingAssignment.save({ session });

    // Populate before returning
    const deletedRecord = await RolePermission.findById(id)
      .populate("roleId", "role status")
      .populate("pageId", "page path status")
      .populate("permissionId", "permission status")
      .session(session);

    await session.commitTransaction();

    return NextResponse.json(deletedRecord);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("RolePermission deletion transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to delete role-permission assignment",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

// PATCH - Activate role-permission assignment by ID (opposite of soft delete)
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

    const existingAssignment =
      await RolePermission.findById(id).session(session);

    if (!existingAssignment) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    existingAssignment.status = RolePermissionStatus.ACTIVE;
    existingAssignment.deletedAt = null;
    existingAssignment.deletedBy = null;
    existingAssignment.deletedReason = null;
    existingAssignment.updatedBy = new mongoose.Types.ObjectId(user!.userId);
    existingAssignment.updatedAt = new Date();

    await existingAssignment.save({ session });

    // Populate before returning
    const activatedRecord = await RolePermission.findById(id)
      .populate("roleId", "role status")
      .populate("pageId", "page path status")
      .populate("permissionId", "permission status")
      .session(session);

    await session.commitTransaction();

    return NextResponse.json(activatedRecord);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("RolePermission activation transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to activate role-permission assignment",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

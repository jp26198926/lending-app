import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Role, { RoleStatus } from "@/models/Role";
import { withAuth } from "@/lib/apiAuth";

const PAGE_PATH = "/admin/role";

// GET - Fetch single role by ID
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

    const record = await Role.findOne({
      _id: id,
      status: RoleStatus.ACTIVE,
    }).lean();

    if (!record) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 },
    );
  }
}

// PUT - Update role by ID
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

    if (!body.role || body.role.trim() === "") {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Find existing role
    const existingRole = await Role.findById(id).session(session);

    if (!existingRole) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Check for duplicate (excluding current role)
    const duplicateRole = await Role.findOne({
      role: body.role,
      _id: { $ne: id },
    }).session(session);

    if (duplicateRole) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Role already exists" },
        { status: 409 },
      );
    }

    existingRole.role = body.role;
    existingRole.updatedBy = new mongoose.Types.ObjectId(user!.userId);
    existingRole.updatedAt = new Date();

    await existingRole.save({ session });

    await session.commitTransaction();

    return NextResponse.json(existingRole);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Role update transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to update role",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

// DELETE - Soft delete role by ID
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

    const existingRole = await Role.findById(id).session(session);

    if (!existingRole) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    existingRole.status = RoleStatus.DELETED;
    existingRole.deletedAt = new Date();
    existingRole.deletedBy = new mongoose.Types.ObjectId(user!.userId);
    existingRole.deletedReason = reason;

    await existingRole.save({ session });

    await session.commitTransaction();

    return NextResponse.json(existingRole);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Role deletion transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to delete role",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

// PATCH - Activate role by ID (opposite of soft delete)
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

    const existingRole = await Role.findById(id).session(session);

    if (!existingRole) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    existingRole.status = RoleStatus.ACTIVE;
    existingRole.deletedAt = null;
    existingRole.deletedBy = null;
    existingRole.deletedReason = null;
    existingRole.updatedBy = new mongoose.Types.ObjectId(user!.userId);
    existingRole.updatedAt = new Date();

    await existingRole.save({ session });

    await session.commitTransaction();

    return NextResponse.json(existingRole);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Role activation transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to activate role",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

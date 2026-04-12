import { NextRequest, NextResponse } from "next/server";
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

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {
      updatedBy: body.updatedBy || null,
    };

    // Allow updating roleId, pageId, and permissionId if provided
    if (body.roleId) updateData.roleId = body.roleId;
    if (body.pageId) updateData.pageId = body.pageId;
    if (body.permissionId) updateData.permissionId = body.permissionId;

    const updatedRecord = await RolePermission.findOneAndUpdate(
      { _id: id /* status: RolePermissionStatus.ACTIVE */ },
      updateData,
      { new: true, runValidators: true },
    )
      .populate("roleId", "role status")
      .populate("pageId", "page path status")
      .populate("permissionId", "permission status");

    if (!updatedRecord) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedRecord);
  } catch (error: unknown) {
    console.error("Error updating role-permission assignment:", error);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { error: "This role-page-permission assignment already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update role-permission assignment" },
      { status: 500 },
    );
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

  try {
    await dbConnect();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deletedBy = searchParams.get("deletedBy");
    const deletedReason = searchParams.get("deletedReason");

    const deletedRecord = await RolePermission.findByIdAndUpdate(
      id,
      {
        status: RolePermissionStatus.DELETED,
        deletedAt: new Date(),
        deletedBy: deletedBy || null,
        deletedReason: deletedReason || null,
      },
      { new: true },
    )
      .populate("roleId", "role status")
      .populate("pageId", "page path status")
      .populate("permissionId", "permission status");

    if (!deletedRecord) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(deletedRecord);
  } catch (error) {
    console.error("Error deleting role-permission assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete role-permission assignment" },
      { status: 500 },
    );
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

  try {
    await dbConnect();
    const { id } = await params;

    const activatedRecord = await RolePermission.findByIdAndUpdate(
      id,
      {
        status: RolePermissionStatus.ACTIVE,
        deletedAt: null,
        deletedBy: null,
        deletedReason: null,
      },
      { new: true },
    )
      .populate("roleId", "role status")
      .populate("pageId", "page path status")
      .populate("permissionId", "permission status");

    if (!activatedRecord) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(activatedRecord);
  } catch (error) {
    console.error("Error activating role-permission assignment:", error);
    return NextResponse.json(
      { error: "Failed to activate role-permission assignment" },
      { status: 500 },
    );
  }
}

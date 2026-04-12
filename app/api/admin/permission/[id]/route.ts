import { NextRequest, NextResponse } from "next/server";
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

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const updatedRecord = await Permission.findOneAndUpdate(
      { _id: id /* status: PermissionStatus.ACTIVE */ },
      {
        permission: body.permission,
      },
      { new: true, runValidators: true },
    );

    if (!updatedRecord) {
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedRecord);
  } catch (error: unknown) {
    console.error("Error updating permission:", error);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { error: "Permission already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update permission" },
      { status: 500 },
    );
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

  try {
    await dbConnect();
    const { id } = await params;

    const deletedRecord = await Permission.findByIdAndUpdate(
      id,
      {
        status: PermissionStatus.DELETED,
        deletedAt: new Date(),
      },
      { new: true },
    );

    if (!deletedRecord) {
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(deletedRecord);
  } catch (error) {
    console.error("Error deleting permission:", error);
    return NextResponse.json(
      { error: "Failed to delete permission" },
      { status: 500 },
    );
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

  try {
    await dbConnect();
    const { id } = await params;

    const activatedRecord = await Permission.findByIdAndUpdate(
      id,
      {
        status: PermissionStatus.ACTIVE,
        deletedAt: null,
        deletedBy: null,
        deletedReason: null,
      },
      { new: true },
    );

    if (!activatedRecord) {
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(activatedRecord);
  } catch (error) {
    console.error("Error activating permission:", error);
    return NextResponse.json(
      { error: "Failed to activate permission" },
      { status: 500 },
    );
  }
}

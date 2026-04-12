import { NextRequest, NextResponse } from "next/server";
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

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const updatedRecord = await Role.findOneAndUpdate(
      { _id: id, status: RoleStatus.ACTIVE },
      {
        role: body.role,
        updatedBy: body.updatedBy || null,
      },
      { new: true, runValidators: true },
    );

    if (!updatedRecord) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json(updatedRecord);
  } catch (error: unknown) {
    console.error("Error updating role:", error);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { error: "Role already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 },
    );
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

  try {
    await dbConnect();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deletedBy = searchParams.get("deletedBy");
    const deletedReason = searchParams.get("deletedReason");

    const deletedRecord = await Role.findByIdAndUpdate(
      id,
      {
        status: RoleStatus.DELETED,
        deletedAt: new Date(),
        deletedBy: deletedBy || null,
        deletedReason: deletedReason || null,
      },
      { new: true },
    );

    if (!deletedRecord) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json(deletedRecord);
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 },
    );
  }
}

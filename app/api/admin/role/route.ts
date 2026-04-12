import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Role, { RoleStatus } from "@/models/Role";
import { withAuth } from "@/lib/apiAuth";

const PAGE_PATH = "/admin/role";

// GET - Fetch all active roles
export async function GET(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await dbConnect();
    const records = await Role.find({ status: RoleStatus.ACTIVE })
      .sort({ createdAt: 1 })
      .lean();
    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 },
    );
  }
}

// POST - Create new role
export async function POST(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await dbConnect();
    const body = await request.json();

    const newRecord = await Role.create({
      role: body.role,
      createdBy: body.createdBy || null,
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating role:", error);
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
      { error: "Failed to create role" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Permission, { PermissionStatus } from "@/models/Permission";
import { withAuth } from "@/lib/apiAuth";

const PAGE_PATH = "/admin/permission";

// GET - Fetch all records (excluding soft deleted)
export async function GET(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await dbConnect();
    const records = await Permission.find({ status: PermissionStatus.ACTIVE })
      .sort({ createdAt: 1 })
      .lean();
    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching records:", error);
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 },
    );
  }
}

// POST - Create new record
export async function POST(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await dbConnect();
    const body = await request.json();

    const newRecord = await Permission.create({
      permission: body.permission,
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating record:", error);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { error: "Path already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create record" },
      { status: 500 },
    );
  }
}

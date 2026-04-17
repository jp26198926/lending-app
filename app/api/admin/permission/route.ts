import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
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

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const body = await request.json();

    if (!body.permission || body.permission.trim() === "") {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Permission name is required" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Check for duplicate
    const existingPermission = await Permission.findOne({
      permission: body.permission,
    }).session(session);

    if (existingPermission) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Permission already exists" },
        { status: 409 },
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

    return NextResponse.json(newRecord[0], { status: 201 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Permission creation transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to create record",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

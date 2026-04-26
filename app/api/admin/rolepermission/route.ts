import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import RolePermission, { RolePermissionStatus } from "@/models/RolePermission";
import { withAuth } from "@/lib/apiAuth";
import "@/models/Role";
import "@/models/Page";
import "@/models/Permission";

const PAGE_PATH = "/admin/rolepermission";

// GET - Fetch all active role-permission assignments
export async function GET(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("roleId");
    const pageId = searchParams.get("pageId");
    const permissionId = searchParams.get("permissionId");
    const status = searchParams.get("status");

    // Build query based on filters
    const query: Record<string, unknown> = {};

    // if (status) {
    //   query.status = { $regex: status, $options: "i" };
    // } else {
    //   // By default, show only ACTIVE assignments
    //   query.status = RolePermissionStatus.ACTIVE;
    // }

    if (roleId) query.roleId = roleId;
    if (pageId) query.pageId = pageId;
    if (permissionId) query.permissionId = permissionId;

    const records = await RolePermission.find(query)
      .populate("roleId", "role status")
      .populate("pageId", "page path status")
      .populate("permissionId", "permission status")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching role-permission assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch role-permission assignments" },
      { status: 500 },
    );
  }
}

// POST - Create new role-permission assignment
export async function POST(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const body = await request.json();

    if (!body.roleId || !body.pageId || !body.permissionId) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Role ID, Page ID, and Permission ID are required" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Check for duplicate
    const existingAssignment = await RolePermission.findOne({
      roleId: body.roleId,
      pageId: body.pageId,
      permissionId: body.permissionId,
    }).session(session);

    if (existingAssignment) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "This role-page-permission assignment already exists" },
        { status: 409 },
      );
    }

    const newRecord = await RolePermission.create(
      [
        {
          roleId: body.roleId,
          pageId: body.pageId,
          permissionId: body.permissionId,
          createdBy: new mongoose.Types.ObjectId(user!.userId),
          status: RolePermissionStatus.ACTIVE,
        },
      ],
      { session },
    );

    // Populate the created record before returning
    const populatedRecord = await RolePermission.findById(newRecord[0]._id)
      .populate("roleId", "role status")
      .populate("pageId", "page path status")
      .populate("permissionId", "permission status")
      .session(session);

    await session.commitTransaction();

    return NextResponse.json(populatedRecord, { status: 201 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("RolePermission creation transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to create role-permission assignment",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

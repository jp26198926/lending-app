import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Page, { PageStatus } from "@/models/Page";
import { withAuth } from "@/lib/apiAuth";

const PAGE_PATH = "/admin/page";

// GET - Fetch single page by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission
  const { error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await dbConnect();
    const { id } = await params;

    const record = await Page.findOne({
      _id: id,
      // status: PageStatus.ACTIVE,
    }).lean();

    if (!record) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 },
    );
  }
}

// PUT - Update page by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission
  const { error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { id } = await params;
    const body = await request.json();

    if (!body.page || !body.path) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Page name and path are required" },
        { status: 400 },
      );
    }

    await dbConnect();

    // Find existing page
    const existingPage = await Page.findById(id).session(session);

    if (!existingPage) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Check for duplicate path (excluding current page)
    const duplicatePage = await Page.findOne({
      path: body.path,
      _id: { $ne: id },
    }).session(session);

    if (duplicatePage) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Path already exists" },
        { status: 409 },
      );
    }

    existingPage.page = body.page;
    existingPage.path = body.path;
    existingPage.parentId = body.parentId || null;
    existingPage.order = body.order;

    await existingPage.save({ session });

    await session.commitTransaction();

    return NextResponse.json(existingPage);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Page update transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to update page",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

// DELETE - Soft delete page by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission
  const { error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { id } = await params;

    await dbConnect();

    const existingPage = await Page.findById(id).session(session);

    if (!existingPage) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    existingPage.status = PageStatus.DELETED;
    existingPage.deletedAt = new Date();
    existingPage.deletedBy = user._id;
    existingPage.deletedReason = reason;

    await session.commitTransaction();

    return NextResponse.json(existingPage);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Page deletion transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to delete page",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

// PATCH - Activate page by ID (opposite of soft delete)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission (using Edit permission)
  const { error } = await withAuth(request, PAGE_PATH, "Edit");
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { id } = await params;

    await dbConnect();

    const existingPage = await Page.findById(id).session(session);

    if (!existingPage) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    existingPage.status = PageStatus.ACTIVE;
    existingPage.deletedAt = null;
    existingPage.deletedBy = null;
    existingPage.deletedReason = null;
    existingPage.updatedBy = user._id;
    existingPage.updatedAt = new Date();

    return NextResponse.json(existingPage);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Page activation transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to activate page",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

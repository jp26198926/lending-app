import { NextRequest, NextResponse } from "next/server";
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
  const { user, error } = await withAuth(request, PAGE_PATH);
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
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const updatedRecord = await Page.findOneAndUpdate(
      { _id: id /* status: PageStatus.ACTIVE */ },
      {
        page: body.page,
        path: body.path,
        parentId: body.parentId || null,
        order: body.order,
      },
      { new: true, runValidators: true },
    );

    if (!updatedRecord) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(updatedRecord);
  } catch (error: unknown) {
    console.error("Error updating page:", error);
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
      { error: "Failed to update page" },
      { status: 500 },
    );
  }
}

// DELETE - Soft delete page by ID
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

    const deletedRecord = await Page.findByIdAndUpdate(
      id,
      {
        status: PageStatus.DELETED,
        deletedAt: new Date(),
      },
      { new: true },
    );

    if (!deletedRecord) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(deletedRecord);
  } catch (error) {
    console.error("Error deleting page:", error);
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 },
    );
  }
}

// PATCH - Activate page by ID (opposite of soft delete)
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

    const activatedRecord = await Page.findByIdAndUpdate(
      id,
      {
        status: PageStatus.ACTIVE,
        deletedAt: null,
        deletedBy: null,
        deletedReason: null,
      },
      { new: true },
    );

    if (!activatedRecord) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(activatedRecord);
  } catch (error) {
    console.error("Error activating page:", error);
    return NextResponse.json(
      { error: "Failed to activate page" },
      { status: 500 },
    );
  }
}

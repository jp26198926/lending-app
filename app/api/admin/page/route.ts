import { NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Page, { PageStatus } from "@/models/Page";
import { withAuth } from "@/lib/apiAuth";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";

const PAGE_PATH = "/admin/page";

// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

// GET - Fetch all records (excluding soft deleted)
export async function GET(request: NextRequest) {
  // Check authentication and permission
  const { error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const path = searchParams.get("path");

    // Build filter
    const filter: Record<string, unknown> = {};

    // if (status) {
    //   filter.status = { $regex: status, $options: "i" };
    // } else {
    //   // By default, show only ACTIVE pages
    //   filter.status = PageStatus.ACTIVE;
    // }

    if (page) {
      filter.page = { $regex: page, $options: "i" };
    }

    if (path) {
      filter.path = { $regex: path, $options: "i" };
    }

    const records = await Page.find(filter).sort({ order: 1 }).lean();
    return corsResponse(request, records, 200);
  } catch (error) {
    console.error("Error fetching records:", error);
    return corsErrorResponse(
      request,
      { error: "Failed to fetch records" },
      500,
    );
  }
}

// POST - Create new record
export async function POST(request: NextRequest) {
  // Check authentication and permission
  const { error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const body = await request.json();

    if (!body.page || !body.path) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Page name and path are required" },
        400,
      );
    }

    await dbConnect();

    // Check for duplicate path
    const existingPage = await Page.findOne({
      path: body.path,
    }).session(session);

    if (existingPage) {
      await session.abortTransaction();
      return corsErrorResponse(request, { error: "Path already exists" }, 409);
    }

    const newRecord = await Page.create(
      [
        {
          page: body.page,
          path: body.path,
          parentId: body.parentId || null,
          order: body.order || 0,
          status: PageStatus.ACTIVE,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return corsResponse(request, newRecord[0], 201);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Page creation transaction error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to create record",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    await session.endSession();
  }
}

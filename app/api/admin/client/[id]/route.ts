import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Client, { ClientStatus } from "@/models/Client";
import { withAuth } from "@/lib/apiAuth";
import "@/models/User";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";

const PAGE_PATH = "/admin/client";

// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

// GET - Fetch single client by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    const client = await Client.findOne({
      _id: id,
      // status: { $ne: ClientStatus.DELETED },
    })
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .lean();

    if (!client) {
      return corsErrorResponse(request, { error: "Client not found" }, 404);
    }

    return corsResponse(request, client, 200);
  } catch (error) {
    console.error("Error fetching client:", error);
    return corsErrorResponse(request, { error: "Failed to fetch client" }, 500);
  }
}

// PUT - Update client by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();

    const { firstName, middleName, lastName, phone, email, address } = body;

    // Connect to database first
    await connectDB();

    // Start session AFTER database connection
    const session = await mongoose.startSession();
    await session.startTransaction();

    // Find the client
    const client = await Client.findById(id).session(session);

    if (!client) {
      await session.abortTransaction();
      await session.endSession();
      return corsErrorResponse(request, { error: "Client not found" }, 404);
    }

    // Check if email is being changed and if it conflicts with another client
    if (email && email.toLowerCase().trim() !== client.email) {
      const existingClient = await Client.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: id },
        // status: { $ne: ClientStatus.DELETED },
      }).session(session);

      if (existingClient) {
        await session.abortTransaction();
        await session.endSession();
        return corsErrorResponse(
          request,
          { error: "Client with this email already exists" },
          409,
        );
      }
    }

    // Update fields
    if (firstName) client.firstName = firstName.trim();
    if (middleName !== undefined)
      client.middleName = middleName ? middleName.trim() : undefined;
    if (lastName) client.lastName = lastName.trim();
    if (phone) client.phone = phone.trim();
    if (email) client.email = email.toLowerCase().trim();
    if (address) client.address = address.trim();
    client.updatedBy = new mongoose.Types.ObjectId(user!.userId);
    client.updatedAt = new Date();

    await client.save({ session });

    // Populate and return
    const updatedClient = await Client.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();
    await session.endSession();

    return corsResponse(request, updatedClient, 200);
  } catch (err: unknown) {
    console.error("Client update transaction error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to update client",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  }
}

// DELETE - Soft delete client by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim() === "") {
      return corsErrorResponse(
        request,
        { error: "Deletion reason is required" },
        400,
      );
    }

    // Connect to database first
    await connectDB();

    // Start session AFTER database connection
    const session = await mongoose.startSession();
    await session.startTransaction();

    const client = await Client.findById(id).session(session);

    if (!client) {
      await session.abortTransaction();
      await session.endSession();
      return corsErrorResponse(request, { error: "Client not found" }, 404);
    }

    // Soft delete
    client.status = ClientStatus.DELETED;
    client.deletedAt = new Date();
    client.deletedBy = new mongoose.Types.ObjectId(user!.userId);
    client.deletedReason = reason;

    await client.save({ session });

    // Populate and return
    const deletedClient = await Client.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();
    await session.endSession();

    return corsResponse(request, deletedClient, 200);
  } catch (err: unknown) {
    console.error("Client deletion transaction error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to delete client",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  }
}

// PATCH - Activate client by ID (opposite of soft delete)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check authentication and permission (using Edit permission)
  const { user, error } = await withAuth(request, PAGE_PATH, "Edit");
  if (error) return error;

  try {
    const { id } = await params;

    // Connect to database first
    await connectDB();

    // Start session AFTER database connection
    const session = await mongoose.startSession();
    await session.startTransaction();

    const client = await Client.findById(id).session(session);

    if (!client) {
      await session.abortTransaction();
      await session.endSession();
      return corsErrorResponse(request, { error: "Client not found" }, 404);
    }

    // Activate the client
    client.status = ClientStatus.ACTIVE;
    client.deletedAt = null;
    client.deletedBy = null;
    client.deletedReason = null;
    client.updatedBy = new mongoose.Types.ObjectId(user!.userId);
    client.updatedAt = new Date();

    await client.save({ session });

    // Populate and return
    const activatedClient = await Client.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();
    await session.endSession();

    return corsResponse(request, activatedClient, 200);
  } catch (err: unknown) {
    console.error("Client activation transaction error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to activate client",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  }
}

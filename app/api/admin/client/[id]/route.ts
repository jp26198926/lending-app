import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Client, { ClientStatus } from "@/models/Client";
import { withAuth } from "@/lib/apiAuth";
import "@/models/User";

const PAGE_PATH = "/admin/client";

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
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client, { status: 200 });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 },
    );
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

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { id } = await params;
    const body = await request.json();

    const { firstName, middleName, lastName, phone, email, address } = body;

    await connectDB();

    // Find the client
    const client = await Client.findById(id).session(session);

    if (!client) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
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
        return NextResponse.json(
          { error: "Client with this email already exists" },
          { status: 409 },
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
    client.updatedBy = user._id;
    client.updatedAt = new Date();

    await client.save({ session });

    // Populate and return
    const updatedClient = await Client.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return NextResponse.json(updatedClient, { status: 200 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Client update transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to update client",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
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

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim() === "") {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Deletion reason is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const client = await Client.findById(id).session(session);

    if (!client) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Soft delete
    client.status = ClientStatus.DELETED;
    client.deletedAt = new Date();
    client.deletedBy = user._id;
    client.deletedReason = reason;

    await client.save({ session });

    // Populate and return
    const deletedClient = await Client.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return NextResponse.json(deletedClient, { status: 200 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Client deletion transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to delete client",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
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

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { id } = await params;

    await connectDB();

    const client = await Client.findById(id).session(session);

    if (!client) {
      await session.abortTransaction();
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Activate the client
    client.status = ClientStatus.ACTIVE;
    client.deletedAt = null;
    client.deletedBy = null;
    client.deletedReason = null;
    client.updatedBy = user._id;
    client.updatedAt = new Date();

    await client.save({ session });

    // Populate and return
    const activatedClient = await Client.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return NextResponse.json(activatedClient, { status: 200 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Client activation transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to activate client",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

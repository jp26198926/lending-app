import { NextRequest, NextResponse } from "next/server";
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

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const {
      firstName,
      middleName,
      lastName,
      phone,
      email,
      address,
      updatedBy,
    } = body;

    // Find the client
    const client = await Client.findById(id);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check if email is being changed and if it conflicts with another client
    if (email && email.toLowerCase().trim() !== client.email) {
      const existingClient = await Client.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: id },
        // status: { $ne: ClientStatus.DELETED },
      });

      if (existingClient) {
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
    if (updatedBy) client.updatedBy = updatedBy;
    await client.save();

    // Populate and return
    const updatedClient = await Client.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email");

    return NextResponse.json(updatedClient, { status: 200 });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 },
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
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deletedBy = searchParams.get("deletedBy");
    const deletedReason = searchParams.get("deletedReason");

    const client = await Client.findById(id);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Soft delete
    client.status = ClientStatus.DELETED;
    client.deletedAt = new Date();
    if (deletedBy) client.deletedBy = deletedBy;
    if (deletedReason) client.deletedReason = deletedReason;

    await client.save();

    // Populate and return
    const deletedClient = await Client.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email");

    return NextResponse.json(deletedClient, { status: 200 });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 },
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
    await connectDB();
    const { id } = await params;

    const client = await Client.findById(id);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Activate the client
    client.status = ClientStatus.ACTIVE;
    client.deletedAt = null;
    client.deletedBy = null;
    client.deletedReason = null;

    await client.save();

    // Populate and return
    const activatedClient = await Client.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email");

    return NextResponse.json(activatedClient, { status: 200 });
  } catch (error) {
    console.error("Error activating client:", error);
    return NextResponse.json(
      { error: "Failed to activate client" },
      { status: 500 },
    );
  }
}

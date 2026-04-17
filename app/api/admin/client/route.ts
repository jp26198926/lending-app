import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Client, { ClientStatus } from "@/models/Client";
import { withAuth } from "@/lib/apiAuth";
import "@/models/User";

const PAGE_PATH = "/admin/client";

// GET - Fetch all clients with optional filtering
export async function GET(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const email = searchParams.get("email");
    const firstName = searchParams.get("firstName");
    const lastName = searchParams.get("lastName");
    const phone = searchParams.get("phone");
    const address = searchParams.get("address");

    // Build filter
    const filter: Record<string, unknown> = {};

    // if (status) {
    //   filter.status = { $regex: status, $options: "i" };
    // } else {
    //   // By default, exclude DELETED clients
    //   filter.status = { $ne: ClientStatus.DELETED };
    // }

    if (email) {
      filter.email = { $regex: email, $options: "i" };
    }

    if (firstName) {
      filter.firstName = { $regex: firstName, $options: "i" };
    }

    if (lastName) {
      filter.lastName = { $regex: lastName, $options: "i" };
    }

    if (phone) {
      filter.phone = { $regex: phone, $options: "i" };
    }

    if (address) {
      filter.address = { $regex: address, $options: "i" };
    }

    const clients = await Client.find(filter)
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .populate("deletedBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 },
    );
  }
}

// POST - Create a new client
export async function POST(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const body = await request.json();
    const { firstName, middleName, lastName, phone, email, address } = body;

    // Validate required fields
    if (!firstName || !lastName || !phone || !email || !address) {
      await session.abortTransaction();
      return NextResponse.json(
        {
          error:
            "First name, last name, phone, email, and address are required",
        },
        { status: 400 },
      );
    }

    await connectDB();

    // Check if client with the same email already exists (excluding DELETED)
    const existingClient = await Client.findOne({
      email: email.toLowerCase().trim(),
      // status: { $ne: ClientStatus.DELETED },
    }).session(session);

    if (existingClient) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: "Client with this email already exists" },
        { status: 409 },
      );
    }

    // Create new client
    const newClient = await Client.create(
      [
        {
          firstName: firstName.trim(),
          middleName: middleName ? middleName.trim() : undefined,
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.toLowerCase().trim(),
          address: address.trim(),
          createdBy: user._id,
          status: ClientStatus.ACTIVE,
        },
      ],
      { session },
    );

    // Populate and return
    const populatedClient = await Client.findById(newClient[0]._id)
      .populate("createdBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return NextResponse.json(populatedClient, { status: 201 });
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Client creation transaction error:", err);
    return NextResponse.json(
      {
        error: "Failed to create client",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  } finally {
    await session.endSession();
  }
}

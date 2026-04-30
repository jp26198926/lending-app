import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { withAuth } from "@/lib/apiAuth";
import "@/models/User";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";

const PAGE_PATH = "/admin/settings";

// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

// GET - Fetch application settings (singleton)
export async function GET(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  try {
    await connectDB();

    // Find the first (and should be only) settings document
    let settings = await Settings.findOne()
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email");

    // If no settings exist, create default settings
    if (!settings) {
      settings = await Settings.create({
        name: "Lending App",
        phone: "",
        email: "",
        cashOnHand: 0,
        createdBy: new mongoose.Types.ObjectId(user!.userId),
        updatedBy: new mongoose.Types.ObjectId(user!.userId),
      });

      await settings.populate("createdBy", "firstName lastName email");
      await settings.populate("updatedBy", "firstName lastName email");
    }

    return corsResponse(request, settings, 200);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return corsErrorResponse(
      request,
      { error: "Failed to fetch settings" },
      500,
    );
  }
}

// PUT - Update application settings
export async function PUT(request: NextRequest) {
  // Check authentication and permission
  const { user, error } = await withAuth(request, PAGE_PATH);
  if (error) return error;

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const body = await request.json();
    const { name, phone, email, cashOnHand } = body;

    // Validate required fields
    if (!name) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Application name is required" },
        400,
      );
    }

    // Validate numeric values
    if (cashOnHand !== undefined && cashOnHand < 0) {
      await session.abortTransaction();
      return corsErrorResponse(
        request,
        { error: "Cash on hand cannot be negative" },
        400,
      );
    }

    await connectDB();

    // Find the settings document
    let settings = await Settings.findOne().session(session);

    // If no settings exist, create new one
    if (!settings) {
      const newSettings = await Settings.create(
        [
          {
            name,
            phone,
            email,
            cashOnHand: cashOnHand || 0,
            createdBy: new mongoose.Types.ObjectId(user!.userId),
            updatedBy: new mongoose.Types.ObjectId(user!.userId),
          },
        ],
        { session },
      );

      await newSettings[0].populate("createdBy", "firstName lastName email");
      await newSettings[0].populate("updatedBy", "firstName lastName email");

      await session.commitTransaction();
      return corsResponse(request, newSettings[0], 200);
    }

    // Update existing settings
    settings.name = name;
    settings.phone = phone;
    settings.email = email;
    if (cashOnHand !== undefined) settings.cashOnHand = cashOnHand;
    settings.updatedBy = new mongoose.Types.ObjectId(user!.userId);
    settings.updatedAt = new Date();

    await settings.save({ session });

    // Populate and return
    const updatedSettings = await Settings.findById(settings._id)
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .session(session);

    await session.commitTransaction();

    return corsResponse(request, updatedSettings, 200);
  } catch (err: unknown) {
    await session.abortTransaction();
    console.error("Settings update transaction error:", err);

    return corsErrorResponse(
      request,
      {
        error: "Failed to update settings",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  } finally {
    await session.endSession();
  }
}

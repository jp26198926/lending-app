import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import DeletionRequest from "@/models/DeletionRequest";
import { getAuthCookie, verifyToken } from "@/lib/auth";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";

// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

// POST - Submit a deletion request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, reason, additionalInfo } = body;

    // Validation
    if (!email || !reason) {
      return corsErrorResponse(
        request,
        { error: "Email and reason are required" },
        400,
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return corsErrorResponse(request, { error: "Invalid email format" }, 400);
    }

    await connectDB();

    // Check if user is authenticated (optional - they can be logged in or not)
    let userId = null;
    const token = await getAuthCookie();
    if (token) {
      const payload = verifyToken(token);
      if (payload && typeof payload !== "string") {
        userId = payload.userId;
      }
    }

    // Check for existing pending request
    const existingRequest = await DeletionRequest.findOne({
      email: email.toLowerCase(),
      status: "PENDING",
    });

    if (existingRequest) {
      return corsErrorResponse(
        request,
        {
          error:
            "A deletion request for this email is already pending. Please check your email for updates.",
        },
        409,
      );
    }

    // Create deletion request
    const deletionRequest = await DeletionRequest.create({
      email: email.toLowerCase(),
      firstName,
      lastName,
      userId,
      reason,
      additionalInfo,
      status: "PENDING",
      requestedAt: new Date(),
    });

    return corsResponse(
      request,
      {
        message:
          "Deletion request submitted successfully. We will process your request and contact you via email.",
        requestId: deletionRequest._id,
      },
      201,
    );
  } catch (err: unknown) {
    console.error("Deletion request error:", err);
    return corsErrorResponse(
      request,
      {
        error: "Failed to submit deletion request",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      500,
    );
  }
}

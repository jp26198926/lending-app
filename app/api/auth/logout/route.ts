import { NextRequest, NextResponse } from "next/server";
import { removeAuthCookie } from "@/lib/auth";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";

// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

// POST - Logout user
export async function POST(request: NextRequest) {
  try {
    // Remove auth cookie
    await removeAuthCookie();

    return corsResponse(request, { message: "Logout successful" }, 200);
  } catch (error) {
    console.error("Logout error:", error);
    return corsErrorResponse(request, { error: "Logout failed" }, 500);
  }
}

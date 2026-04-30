import { NextRequest, NextResponse } from "next/server";

/**
 * CORS Configuration - Dynamic Origins from Environment Variables
 * Set ALLOWED_ORIGINS in .env.local as comma-separated URLs
 * Example: ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081,https://app.example.com
 */
const getAllowedOrigins = (): string[] => {
  // Read from environment variable (comma-separated)
  const originsEnv = process.env.ALLOWED_ORIGINS;

  if (originsEnv) {
    // Split by comma and trim whitespace
    return originsEnv.split(",").map((origin) => origin.trim());
  }

  // Fallback for development if env var not set
  return ["http://localhost:3000"];
};

const ALLOWED_ORIGINS = getAllowedOrigins();

/**
 * Apply CORS headers to a response
 */
export function setCorsHeaders(
  response: NextResponse,
  origin: string | null,
): NextResponse {
  // Check if the origin is allowed
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Cookie",
  );
  response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours

  return response;
}

/**
 * Handle OPTIONS preflight request
 */
export function handleCorsPreFlight(request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");
  const response = new NextResponse(null, { status: 204 });

  return setCorsHeaders(response, origin);
}

/**
 * Create a CORS-enabled response
 */
export function corsResponse(
  request: NextRequest,
  data: unknown,
  status: number = 200,
): NextResponse {
  const origin = request.headers.get("origin");
  const response = NextResponse.json(data, { status });

  return setCorsHeaders(response, origin);
}

/**
 * Wrap an error response with CORS headers
 */
export function corsErrorResponse(
  request: NextRequest,
  error: { error: string; details?: string },
  status: number = 500,
): NextResponse {
  return corsResponse(request, error, status);
}

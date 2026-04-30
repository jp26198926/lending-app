import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// JWT configuration
const JWT_SECRET: string =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN: string = (process.env.JWT_EXPIRES_IN || "7d") as string; // Token expires in 7 days

export interface TokenPayload {
  userId: string;
  email: string;
  roleId: string;
}

/**
 * Check if request is from mobile app
 * Mobile apps should send X-Client-Type: mobile header
 */
export function isMobileClient(request: NextRequest): boolean {
  const clientType = request.headers.get("x-client-type");
  const userAgent = request.headers.get("user-agent") || "";

  // Check for explicit mobile client header
  if (clientType === "mobile") {
    return true;
  }

  // Check for common mobile/React Native user agents
  if (
    userAgent.includes("Expo") ||
    userAgent.includes("ReactNative") ||
    userAgent.includes("okhttp")
  ) {
    return true;
  }

  return false;
}

// Generate JWT token
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as any);
}

// Verify JWT token
export function verifyToken(token: string): TokenPayload | null {
  try {
    // Validate token format before verification
    if (!token || typeof token !== "string" || token.trim() === "") {
      console.error("Token validation failed: empty or invalid token");
      return null;
    }

    // Check if token has proper JWT format (3 parts separated by dots)
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error(
        `Invalid JWT format: expected 3 parts, got ${parts.length}. Token preview: ${token.substring(0, 20)}...`,
      );
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    if (token) {
      console.error(
        `Token details - Length: ${token.length}, Preview: ${token.substring(0, 30)}...`,
      );
    }
    return null;
  }
}

// Set auth cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

// Get auth cookie
export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("auth-token")?.value;
}

// Remove auth cookie
export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}

/**
 * Get token from Authorization header (for mobile apps)
 */
export function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return null;
  }

  // Check for Bearer token format
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

// Get current user from cookie (web) or Authorization header (mobile)
export async function getCurrentUser(
  request?: NextRequest,
): Promise<TokenPayload | null> {
  // If request provided, try Authorization header first (mobile)
  if (request) {
    const bearerToken = getAuthToken(request);
    if (bearerToken && bearerToken.trim() !== "") {
      return verifyToken(bearerToken);
    }
  }

  // Fall back to cookie (web browsers)
  const token = await getAuthCookie();
  if (!token || token.trim() === "") {
    return null;
  }

  return verifyToken(token);
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

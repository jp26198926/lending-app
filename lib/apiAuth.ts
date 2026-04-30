import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import RolePermission, { RolePermissionStatus } from "@/models/RolePermission";
import "@/models/Role";
import "@/models/Page";
import "@/models/Permission";
import { corsErrorResponse } from "@/lib/cors";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  roleId: string;
}

export interface ApiAuthResult {
  user: AuthenticatedUser;
  isValid: boolean;
  error?: { message: string; status: number };
}

/**
 * Check if user is authenticated
 * Supports both cookie-based (web) and Bearer token (mobile) authentication
 */
export async function checkAuth(request?: NextRequest): Promise<ApiAuthResult> {
  const tokenPayload = await getCurrentUser(request);

  if (!tokenPayload) {
    return {
      user: null as any,
      isValid: false,
      error: {
        message: "Unauthorized - Please login",
        status: 401,
      },
    };
  }

  // Verify user exists in database
  await connectDB();
  const user = await User.findById(tokenPayload.userId).select(
    "_id email roleId status",
  );

  if (!user || user.status !== "ACTIVE") {
    return {
      user: null as any,
      isValid: false,
      error: {
        message: "User not found or inactive",
        status: 401,
      },
    };
  }

  return {
    user: {
      userId: user._id.toString(),
      email: user.email,
      roleId: user.roleId.toString(),
    },
    isValid: true,
  };
}

/**
 * Check if user has specific permission for a page
 */
export async function checkPermission(
  roleId: string,
  pagePath: string,
  permissionName: string,
): Promise<boolean> {
  try {
    await connectDB();

    // Find the page by path
    const Page = (await import("@/models/Page")).default;
    const page = await Page.findOne({ path: pagePath, status: "ACTIVE" });

    if (!page) {
      console.warn(`Page not found: ${pagePath}`);
      return false;
    }

    // Find the permission by name
    const Permission = (await import("@/models/Permission")).default;
    const permission = await Permission.findOne({
      permission: { $regex: new RegExp(`^${permissionName}$`, "i") },
      status: "ACTIVE",
    });

    if (!permission) {
      console.warn(`Permission not found: ${permissionName}`);
      return false;
    }

    // Check if role has this permission for this page
    const rolePermission = await RolePermission.findOne({
      roleId,
      pageId: page._id,
      permissionId: permission._id,
      status: RolePermissionStatus.ACTIVE,
    });

    return !!rolePermission;
  } catch (error) {
    console.error("Permission check error:", error);
    return false;
  }
}

/**
 * Unified middleware to check authentication and permission
 */
export async function requireAuth(
  request: NextRequest,
  pagePath: string,
  permissionName: string,
): Promise<{ user?: AuthenticatedUser; error?: NextResponse }> {
  // Check authentication (supports both cookie and Bearer token)
  const authResult = await checkAuth(request);

  if (!authResult.isValid || !authResult.user) {
    return {
      error: corsErrorResponse(
        request,
        { error: authResult.error?.message || "Unauthorized" },
        authResult.error?.status || 401,
      ),
    };
  }

  // Check permission
  const hasPermission = await checkPermission(
    authResult.user.roleId,
    pagePath,
    permissionName,
  );

  if (!hasPermission) {
    return {
      error: corsErrorResponse(
        request,
        {
          error: `Access denied. You do not have ${permissionName} permission for this resource.`,
        },
        403,
      ),
    };
  }

  return { user: authResult.user };
}

/**
 * Map HTTP method to permission name
 */
export function getPermissionForMethod(method: string): string {
  const permissionMap: Record<string, string> = {
    GET: "View",
    POST: "Add",
    PUT: "Edit",
    PATCH: "Edit",
    DELETE: "Delete",
  };

  return permissionMap[method] || "View";
}

/**
 * Convenience wrapper for API routes with automatic method-to-permission mapping
 */
export async function withAuth(
  request: NextRequest,
  pagePath: string,
  customPermission?: string,
): Promise<{ user?: AuthenticatedUser; error?: NextResponse }> {
  const method = request.method;
  const permission = customPermission || getPermissionForMethod(method);

  return requireAuth(request, pagePath, permission);
}

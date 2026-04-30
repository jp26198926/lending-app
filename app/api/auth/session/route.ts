import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import RolePermission, { RolePermissionStatus } from "@/models/RolePermission";
import "@/models/Role";
import "@/models/Page";
import "@/models/Permission";
import {
  handleCorsPreFlight,
  corsResponse,
  corsErrorResponse,
} from "@/lib/cors";

// OPTIONS - Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}

// GET - Check current session
export async function GET(request: NextRequest) {
  try {
    // Support both cookie (web) and Bearer token (mobile) authentication
    const tokenPayload = await getCurrentUser(request);

    if (!tokenPayload) {
      return corsResponse(request, { authenticated: false, user: null }, 401);
    }

    // Fetch full user details from database
    await connectDB();
    const user = await User.findById(tokenPayload.userId)
      .populate("roleId", "role status")
      .select("-password");

    if (!user) {
      return corsResponse(request, { authenticated: false, user: null }, 401);
    }

    // Fetch role permissions for this user's role
    const rolePermissions = await RolePermission.find({
      roleId: user.roleId._id,
      status: RolePermissionStatus.ACTIVE,
    })
      .populate("pageId", "page path parentId order status")
      .populate("permissionId", "permission status")
      .sort({ "pageId.order": 1 })
      .lean();

    // Group permissions by page
    interface PermissionsByPage {
      [key: string]: {
        page: unknown;
        permissions: unknown[];
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const permissionsByPage = (rolePermissions as any[]).reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc: PermissionsByPage, rp: any) => {
        const pageId = rp.pageId._id.toString();

        if (!acc[pageId]) {
          acc[pageId] = {
            page: rp.pageId,
            permissions: [],
          };
        }

        acc[pageId].permissions.push(rp.permissionId);

        return acc;
      },
      {} as PermissionsByPage,
    );

    // Convert to array format
    const userPermissions = Object.values(permissionsByPage);

    return corsResponse(
      request,
      {
        authenticated: true,
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          roleId: user.roleId,
          status: user.status,
        },
        permissions: userPermissions,
      },
      200,
    );
  } catch (error) {
    console.error("Session check error:", error);
    return corsResponse(request, { authenticated: false, user: null }, 500);
  }
}

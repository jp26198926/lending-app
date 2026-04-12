import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User, { UserStatus } from "@/models/User";
import "@/models/Role";
import RolePermission, { RolePermissionStatus } from "@/models/RolePermission";
import "@/models/Page";
import "@/models/Permission";
import { generateToken, setAuthCookie } from "@/lib/auth";

// POST - Login user
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      status: UserStatus.ACTIVE,
    }).populate("roleId", "role status");

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
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

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      roleId: user.roleId._id.toString(),
    });

    // Set cookie
    await setAuthCookie(token);

    // Return user data (without password)
    return NextResponse.json(
      {
        message: "Login successful",
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
      { status: 200 },
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 },
    );
  }
}

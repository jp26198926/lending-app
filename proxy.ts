import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

// Protected routes that require authentication
const protectedRoutes = ["/admin"];

// Public routes that should redirect to dashboard if logged in
const authRoutes = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Check if the route is an auth route (login, register, etc.)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // If accessing a protected route without a valid token, redirect to login
  if (isProtectedRoute) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If accessing auth routes while logged in, redirect to dashboard
  if (isAuthRoute && token) {
    const payload = verifyToken(token);
    if (payload) {
      return NextResponse.redirect(new URL("/admin/user", request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes use this proxy
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - they have their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

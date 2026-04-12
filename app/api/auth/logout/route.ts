import { NextResponse } from "next/server";
import { removeAuthCookie } from "@/lib/auth";

// POST - Logout user
export async function POST() {
  try {
    // Remove auth cookie
    await removeAuthCookie();

    return NextResponse.json(
      { message: "Logout successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}

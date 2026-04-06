export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminAuth } from "@/app/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // 5 days
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    // Create session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const response = NextResponse.json({ status: "success" });

    // Set secure session cookie
    response.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn / 1000,
    });

    return response;
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

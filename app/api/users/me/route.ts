import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/server";

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const session = cookie
      .split("; ")
      .find((c) => c.startsWith("session="))
      ?.split("=")[1];

    if (!session) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    // Verify session cookie
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const uid = decoded.uid;

    // Fetch user profile
    const snap = await adminDb.collection("users").doc(uid).get();
    const user = snap.data();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      uid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles || [],
      churchId: user.churchId || null,
    });
  } catch (err) {
    console.error("Error in /api/users/me:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

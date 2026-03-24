import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      uid,
      email,
      firstName,
      lastName,
    } = body;

    if (!uid || !email) {
      return NextResponse.json(
        { error: "Missing required fields: uid or email" },
        { status: 400 }
      );
    }

    // SECURITY: Signup users must always start with:
    // - no roles
    // - no church
    // - basic profile only
    await adminDb.collection("users").doc(uid).set(
      {
        id: uid,
        email,
        firstName: firstName || "",
        lastName: lastName || "",
        roles: [],          // <-- no roles on signup
        churchId: null,     // <-- no church on signup
        createdAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

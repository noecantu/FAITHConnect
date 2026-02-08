import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      uid,
      email,
      firstName,
      lastName,
      roles,
      churchId,
    } = body;

    if (!uid || !email) {
      return NextResponse.json(
        { error: "Missing required fields: uid or email" },
        { status: 400 }
      );
    }

    // SECURITY: Prevent privilege escalation
    const allowedRoles = ["Admin", "Member", "MusicManager", "MusicMember"];
    const safeRoles = (roles || []).filter((r: string) =>
      allowedRoles.includes(r)
    );

    // Default to Member if no valid roles provided
    const finalRoles = safeRoles.length > 0 ? safeRoles : ["Member"];

    // Create Firestore user document
    await adminDb.collection("users").doc(uid).set(
      {
        id: uid,
        email,
        firstName: firstName || "",
        lastName: lastName || "",
        roles: finalRoles,
        churchId: churchId ?? null,
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

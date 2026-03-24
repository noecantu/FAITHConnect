export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, profilePhotoUrl } = body;

    const uid = req.headers.get("x-user-id");
    if (!uid) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch actor profile to ensure user exists
    const userSnap = await adminDb.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Whitelist fields that can be updated
    const updates: Record<string, any> = {};
    if (typeof firstName === "string") updates.firstName = firstName;
    if (typeof lastName === "string") updates.lastName = lastName;
    if (typeof profilePhotoUrl === "string") updates.profilePhotoUrl = profilePhotoUrl;

    await adminDb.collection("users").doc(uid).update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/server";
import admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const { token, churchName } = await req.json();

    if (!token || !churchName) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Verify Firebase ID token
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // Create a slug from the church name
    const slug = churchName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // 1. Create church (doc ID = slug)
    await adminDb
      .collection("churches")
      .doc(slug)
      .set({
        slug,
        name: churchName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: uid,
        settings: {
          featureFlags: {},
          platformHealth: {},
        },
      });

    // 2. Update user (roles array, not role string)
    await adminDb
      .collection("users")
      .doc(uid)
      .set(
        {
          churchId: slug,
          roles: ["Admin"],
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    // 3. Create membership record
    await adminDb
      .collection("churches")
      .doc(slug)
      .collection("members")
      .doc(uid)
      .set({
        roles: ["Admin"],
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ churchId: slug });
  } catch (error) {
    console.error("Error creating church:", error);
    return NextResponse.json(
      { error: "Failed to create church." },
      { status: 500 }
    );
  }
}

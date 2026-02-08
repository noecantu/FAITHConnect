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

    const churchId = crypto.randomUUID();

    // 1. Create church
    await adminDb
      .collection("churches")
      .doc(churchId)
      .set({
        name: churchName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: uid,
        settings: {
          featureFlags: {},
          platformHealth: {},
        },
      });

    // 2. Update user
    await adminDb
      .collection("users")
      .doc(uid)
      .set(
        {
          churchId,
          role: "admin",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    // 3. Create membership record
    await adminDb
      .collection("churches")
      .doc(churchId)
      .collection("members")
      .doc(uid)
      .set({
        role: "admin",
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ churchId });
  } catch (error) {
    console.error("Error creating church:", error);
    return NextResponse.json(
      { error: "Failed to create church." },
      { status: 500 }
    );
  }
}

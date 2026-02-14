import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/server";
import admin from "firebase-admin";
import slugify from "slugify";

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

    // 1. Generate slug from church name
    let slug = slugify(churchName, { lower: true, strict: true });

    // 2. Ensure uniqueness
    const existing = await adminDb.collection("churches").doc(slug).get();
    if (existing.exists) {
      slug = `${slug}-${Math.floor(Math.random() * 10000)}`;
    }

    // 3. Create church using slug as the document ID
    await adminDb
      .collection("churches")
      .doc(slug)
      .set({
        name: churchName,
        slug,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: uid,
        settings: {
          featureFlags: {},
          platformHealth: {},
        },
      });

    // 4. Update user with slug instead of UUID
    await adminDb
      .collection("users")
      .doc(uid)
      .set(
        {
          churchId: slug,
          role: "admin",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    // 5. Create membership record
    await adminDb
      .collection("churches")
      .doc(slug)
      .collection("members")
      .doc(uid)
      .set({
        role: "admin",
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ slug });
  } catch (error) {
    console.error("Error creating church:", error);
    return NextResponse.json(
      { error: "Failed to create church." },
      { status: 500 }
    );
  }
}

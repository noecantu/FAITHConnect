export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/lib/firebase/admin";
import admin from "firebase-admin";
import type { Role } from "@/app/lib/auth/roles";

export async function POST(req: Request) {
  try {
    const { churchName } = await req.json();

    if (!churchName) {
      return NextResponse.json(
        { error: "Missing churchName." },
        { status: 400 }
      );
    }

    // Extract session cookie
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/session=([^;]+)/);
    const sessionCookie = match?.[1];

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    // Verify session cookie → get UID
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const uid = decoded.uid;

    // Create slug from church name
    const slug = churchName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // 1. Create church
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

    // 2. Update user with churchId + Admin role
    const adminRole: Role[] = ["Admin"];

    await adminDb
      .collection("users")
      .doc(uid)
      .set(
        {
          churchId: slug,
          roles: adminRole,
          onboardingStep: "done",
          onboardingComplete: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    // 3. Apply custom claims
    await adminAuth.setCustomUserClaims(uid, {
      roles: adminRole,
      churchId: slug,
    });

    // 4. Add membership record
    await adminDb
      .collection("churches")
      .doc(slug)
      .collection("members")
      .doc(uid)
      .set({
        roles: adminRole,
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

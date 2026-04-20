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

    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json(
        { error: "User profile not found. Please restart onboarding." },
        { status: 403 }
      );
    }

    const userData = userSnap.data() ?? {};

    if (userData.onboardingStep !== "create-church") {
      return NextResponse.json(
        { error: "Complete payment before creating your church." },
        { status: 403 }
      );
    }

    if (!userData.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Active subscription required before church creation." },
        { status: 403 }
      );
    }

    // Create slug from church name
    const slug = churchName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // 1. Create church with unique slug
    const baseSlug = slug || `church-${uid.slice(0, 6)}`;
    let finalSlug = baseSlug;
    let suffix = 1;

    // Prevent overwriting an existing church document.
    while ((await adminDb.collection("churches").doc(finalSlug).get()).exists) {
      finalSlug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    await adminDb
      .collection("churches")
      .doc(finalSlug)
      .set({
        slug: finalSlug,
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
          churchId: finalSlug,
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
      churchId: finalSlug,
    });

    // 4. Add membership record
    await adminDb
      .collection("churches")
      .doc(finalSlug)
      .collection("members")
      .doc(uid)
      .set({
        roles: adminRole,
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ churchId: finalSlug });

  } catch (error) {
    console.error("Error creating church:", error);
    return NextResponse.json(
      { error: "Failed to create church." },
      { status: 500 }
    );
  }
}

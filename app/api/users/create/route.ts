export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/firebase/admin";
import admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      uid,
      email,
      firstName,
      lastName,
      token,
    } = body;

    if (!uid || !email || !token) {
      return NextResponse.json(
        { error: "Missing required fields: uid, email, or token" },
        { status: 400 }
      );
    }

    // 1. Validate signup token
    const tokenRef = adminDb.collection("signupTokens").doc(token);
    const tokenSnap = await tokenRef.get();

    if (!tokenSnap.exists) {
      return NextResponse.json(
        { error: "Invalid signup token" },
        { status: 403 }
      );
    }

    const tokenData = tokenSnap.data();

    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid signup token data" },
        { status: 403 }
      );
    }

    if (tokenData.expiresAt.toMillis() < Date.now()) {
      return NextResponse.json(
        { error: "Signup token expired" },
        { status: 403 }
      );
    }

    if (tokenData.used) {
      return NextResponse.json(
        { error: "Signup token already used" },
        { status: 403 }
      );
    }

    // 2. Create user profile
    await adminDb.collection("users").doc(uid).set(
      {
        id: uid,
        email,
        firstName: firstName || "",
        lastName: lastName || "",
        roles: [],
        churchId: null,
        createdAt: new Date(),
        planId: tokenData.planId ?? null,
        stripeCustomerId: tokenData.customerId ?? null,
        stripeSubscriptionId: tokenData.subscriptionId ?? null,
      },
      { merge: true }
    );

    // 3. Mark token as used
    await tokenRef.update({
      used: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
      usedBy: uid,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

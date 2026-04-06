//app/api/users/update-onboarding-step/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const { onboardingStep, churchId, onboardingComplete } = await req.json();

    // Extract session cookie
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/session=([^;]+)/);
    const sessionCookie = match?.[1];

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Verify session cookie → get UID
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const uid = decoded.uid;

    // Build update object
    const updateData: Record<string, any> = {};
    if (onboardingStep) updateData.onboardingStep = onboardingStep;
    if (churchId) updateData.churchId = churchId;
    if (typeof onboardingComplete === "boolean")
      updateData.onboardingComplete = onboardingComplete;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      // Do NOT error — prevents onboarding crashes after Stripe
      return NextResponse.json({ success: true });
    }

    await userRef.set(updateData, { merge: true });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Update onboarding step error:", err);
    return NextResponse.json(
      { error: "Failed to update onboarding step" },
      { status: 500 }
    );
  }
}

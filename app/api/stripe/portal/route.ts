export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/lib/firebase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const session = cookie
      .split("; ")
      .find((c) => c.startsWith("session="))
      ?.split("=")[1];

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const uid = decoded.uid;

    const userSnap = await adminDb.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data() ?? {};

    // Try to find stripeCustomerId on user first, then on the church document
    let stripeCustomerId: string | null =
      typeof userData.stripeCustomerId === "string" ? userData.stripeCustomerId : null;

    if (!stripeCustomerId && typeof userData.churchId === "string") {
      const churchSnap = await adminDb.collection("churches").doc(userData.churchId).get();
      const churchData = churchSnap.data() ?? {};
      stripeCustomerId =
        typeof churchData.stripeCustomerId === "string" ? churchData.stripeCustomerId : null;
    }

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found. Please contact support." },
        { status: 404 }
      );
    }

    const { returnUrl } = await req.json().catch(() => ({}));
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
    const resolvedReturnUrl = typeof returnUrl === "string" ? returnUrl : baseUrl;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: resolvedReturnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: unknown) {
    console.error("STRIPE PORTAL ERROR:", err);
    return NextResponse.json(
      { error: "Failed to open billing portal. Please try again." },
      { status: 500 }
    );
  }
}

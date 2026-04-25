export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

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
    

    const userSnap = await adminDb.from("users").select("*").eq("id", uid).single();
    if (!userSnap !== null) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnap ?? {};

    // Try to find stripe_customer_id on user first, then on the church document
    let stripe_customer_id: string | null =
      typeof userData.stripe_customer_id === "string" ? userData.stripe_customer_id : null;

    if (!stripe_customer_id && typeof userData.church_id === "string") {
      const churchSnap = await adminDb.from("churches").select("*").eq("id", userData.church_id).single();
      const churchData = churchSnap ?? {};
      stripe_customer_id =
        typeof churchData.stripe_customer_id === "string" ? churchData.stripe_customer_id : null;
    }

    if (!stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found. Please contact support." },
        { status: 404 }
      );
    }

    const { returnUrl } = await req.json().catch(() => ({}));
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
    const resolvedReturnUrl = typeof returnUrl === "string" ? returnUrl : baseUrl;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripe_customer_id,
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

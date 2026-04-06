export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";

import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  try {
    const { plan } = await req.json();

    // Map FAITH Connect plan names → Stripe Price IDs
    const priceMap: Record<string, string> = {
      starter: process.env.STRIPE_PRICE_STARTER!,
      standard: process.env.STRIPE_PRICE_STANDARD!,
      pro: process.env.STRIPE_PRICE_PRO!,
    };

    const priceId = priceMap[plan];

    if (!priceId) {
      console.error("Invalid plan received:", plan);
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    console.log("PLAN RECEIVED:", plan);
    console.log("PRICE FOUND:", priceId);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_URL}/onboarding/billing/success?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/onboarding/billing?plan=${plan}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("STRIPE CHECKOUT ERROR:", err);
    return NextResponse.json(
      { error: "Unable to create checkout session" },
      { status: 500 }
    );
  }
}

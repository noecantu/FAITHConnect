import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/app/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle checkout completion
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;
    const planId = session.metadata?.planId;

    // Generate a secure onboarding token
    const token = randomUUID();

    await adminDb.collection("signupTokens").doc(token).set({
      planId: planId ?? null,
      customerId,
      subscriptionId,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + 1000 * 60 * 30), // 30 min expiry
      used: false,
    });

    console.log("Signup token created:", token);

    // You can redirect the user to signup via success_url
    // Example: https://yourapp.com/signup?token=abc123

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}

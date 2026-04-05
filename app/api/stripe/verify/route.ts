import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      status: session.payment_status,
      customer: session.customer,
      subscription: session.subscription,
    });
  } catch (err: any) {
    console.error("VERIFY ERROR:", err);
    return NextResponse.json(
      { error: "Unable to verify session" },
      { status: 500 }
    );
  }
}

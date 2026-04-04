import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  const { plan } = await req.json();

  const priceMap: Record<string, string> = {
    starter: "price_123",
    standard: "price_456",
    pro: "price_789",
  };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: priceMap[plan],
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_URL}/signup`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/onboarding/billing?plan=${plan}`,
  });

  return NextResponse.json({ url: session.url });
}

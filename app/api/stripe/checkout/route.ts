export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";

import Stripe from "stripe";
import { NextResponse } from "next/server";
import {
  normalizeBillingCycle,
  normalizePlanId,
  type BillingCycle,
  type PlanId,
} from "@/app/lib/pricing-plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: Request) {
  try {
    const { plan, cycle } = await req.json();
    const normalizedPlan = normalizePlanId(plan);
    const normalizedCycle = normalizeBillingCycle(cycle);

    if (!normalizedPlan) {
      console.error("Invalid plan received:", plan);
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    const priceMap: Record<PlanId, Record<BillingCycle, string | undefined>> = {
      beginning: {
        monthly: process.env.STRIPE_PRICE_BEGINNING_MONTHLY,
        yearly: process.env.STRIPE_PRICE_BEGINNING_YEARLY,
      },
      growing: {
        monthly: process.env.STRIPE_PRICE_GROWING_MONTHLY,
        yearly: process.env.STRIPE_PRICE_GROWING_YEARLY,
      },
      abounding: {
        monthly: process.env.STRIPE_PRICE_ABOUNDING_MONTHLY,
        yearly: process.env.STRIPE_PRICE_ABOUNDING_YEARLY,
      },
    };

    const priceId = priceMap[normalizedPlan][normalizedCycle];

    if (!priceId) {
      console.error("Missing Stripe price configuration", {
        plan: normalizedPlan,
        cycle: normalizedCycle,
      });
      return NextResponse.json(
        { error: "Billing configuration not ready for selected plan." },
        { status: 500 }
      );
    }

    console.log("PLAN RECEIVED:", normalizedPlan);
    console.log("BILLING CYCLE:", normalizedCycle);
    console.log("PRICE FOUND:", priceId);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        planId: normalizedPlan,
        billingCycle: normalizedCycle,
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/onboarding/billing/success?plan=${normalizedPlan}&cycle=${normalizedCycle}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/onboarding/billing?plan=${normalizedPlan}&cycle=${normalizedCycle}`,
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

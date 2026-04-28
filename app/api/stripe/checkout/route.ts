export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "iad1";

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";
import {
  normalizeBillingCycle,
  normalizePlanId,
  type BillingCycle,
  type PlanId,
} from "@/app/lib/pricing-plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

async function getSessionContext(): Promise<{ email?: string; uid?: string }> {
  try {
    const authUser = await getServerUser();
    return {
      email: authUser?.email ?? undefined,
      uid: authUser?.id ?? undefined,
    };
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { plan, cycle, trial } = body;
    const normalizedPlan = normalizePlanId(plan);
    const normalizedCycle = normalizeBillingCycle(cycle);
    const isTrialing = trial === true;

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
      beginningPlus: {
        monthly: process.env.STRIPE_PRICE_BEGINNING_PLUS_MONTHLY,
        yearly: process.env.STRIPE_PRICE_BEGINNING_PLUS_YEARLY,
      },
      growing: {
        monthly: process.env.STRIPE_PRICE_GROWING_MONTHLY,
        yearly: process.env.STRIPE_PRICE_GROWING_YEARLY,
      },
      growingPlus: {
        monthly: process.env.STRIPE_PRICE_GROWING_PLUS_MONTHLY,
        yearly: process.env.STRIPE_PRICE_GROWING_PLUS_YEARLY,
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

    const { email: customerEmail, uid } = await getSessionContext();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: isTrialing ? { trial_period_days: 30 } : undefined,
      metadata: {
        plan_id: normalizedPlan,
        planId: normalizedPlan,
        billingCycle: normalizedCycle,
        ...(uid ? { uid } : {}),
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/onboarding/billing/success?plan=${normalizedPlan}&cycle=${normalizedCycle}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/onboarding/billing?plan=${normalizedPlan}&cycle=${normalizedCycle}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("STRIPE CHECKOUT ERROR:", err);

    if (
      err?.type === "StripeInvalidRequestError" &&
      err?.code === "resource_missing" &&
      err?.param === "line_items[0][price]"
    ) {
      return NextResponse.json(
        {
          error:
            "Stripe price ID not found for the current Stripe account/mode. Verify STRIPE_PRICE_* values match the same account and test/live mode as STRIPE_SECRET_KEY.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Unable to create checkout session" },
      { status: 500 }
    );
  }
}

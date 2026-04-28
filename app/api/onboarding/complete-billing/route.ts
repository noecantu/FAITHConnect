export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { normalizePlanId } from "@/app/lib/pricing-plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const HEALTHY_STATUSES = new Set(["active", "trialing"]);

export async function POST(req: Request) {
  try {
    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
    const requestedPlanId = typeof body.planId === "string" ? body.planId : null;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId." }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer"],
    });

    const isPaid =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required";

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id ?? null;

    if (!isPaid || !subscriptionId) {
      return NextResponse.json(
        { error: "Payment has not been completed for this session." },
        { status: 403 }
      );
    }

    const authEmail = (authUser.email ?? "").trim().toLowerCase();
    const sessionUid = session.metadata?.uid ?? null;
    const expandedCustomerEmail =
      typeof session.customer === "object" &&
      session.customer &&
      "email" in session.customer
        ? session.customer.email
        : null;
    const customerEmail =
      (session.customer_details?.email ??
        expandedCustomerEmail ??
        "")
        .trim()
        .toLowerCase();

    const ownsByUid = sessionUid ? sessionUid === authUser.id : false;
    const ownsByEmail = !sessionUid && authEmail.length > 0 && customerEmail.length > 0 && authEmail === customerEmail;

    if (!ownsByUid && !ownsByEmail) {
      return NextResponse.json(
        { error: "Checkout session does not belong to authenticated user." },
        { status: 403 }
      );
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const billingStatus = subscription.status;

    if (!HEALTHY_STATUSES.has(billingStatus)) {
      return NextResponse.json(
        { error: "Subscription is not active or trialing." },
        { status: 403 }
      );
    }

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id ?? null;

    const planId =
      normalizePlanId(requestedPlanId) ??
      normalizePlanId(session.metadata?.plan_id ?? null) ??
      normalizePlanId(session.metadata?.planId ?? null);

    const { error } = await adminDb
      .from("users")
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        billing_status: billingStatus,
        billing_delinquent: false,
        billing_updated_at: new Date().toISOString(),
        onboarding_step: "create-church",
        onboarding_complete: false,
        ...(planId ? { plan_id: planId } : {}),
      })
      .eq("id", authUser.id);

    if (error) throw error;

    return NextResponse.json({ success: true, onboardingStep: "create-church" });
  } catch (error) {
    console.error("Complete billing error:", error);
    return NextResponse.json(
      { error: "Unable to complete billing onboarding step." },
      { status: 500 }
    );
  }
}

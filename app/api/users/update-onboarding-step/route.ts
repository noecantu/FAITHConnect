export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

const VALID_STEPS = ["choose-plan", "confirm-plan", "admin-credentials", "billing", "create-church", "done"];

export async function POST(req: Request) {
  try {
    const {
      onboardingStep,
      churchId,
      onboardingComplete,
      stripeCustomerId,
      stripeSubscriptionId,
      planId,
    } = await req.json();

    if (onboardingStep && !VALID_STEPS.includes(onboardingStep)) {
      return NextResponse.json({ error: "Invalid onboarding step." }, { status: 400 });
    }

    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const uid = authUser.id;

    const updateData: Record<string, unknown> = {};
    if (onboardingStep) updateData.onboarding_step = onboardingStep;
    if (churchId) updateData.church_id = churchId;
    if (planId) updateData.plan_id = planId;
    if (stripeCustomerId) updateData.stripe_customer_id = stripeCustomerId;
    if (stripeSubscriptionId) updateData.stripe_subscription_id = stripeSubscriptionId;
    if (typeof onboardingComplete === "boolean") updateData.onboarding_complete = onboardingComplete;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const { error } = await adminDb
      .from("users")
      .upsert({ id: uid, email: authUser.email ?? "", ...updateData })
      .eq("id", uid);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update onboarding step error:", err);
    return NextResponse.json({ error: "Failed to update onboarding step" }, { status: 500 });
  }
}

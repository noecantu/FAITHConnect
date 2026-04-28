export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { normalizePlanId } from "@/app/lib/pricing-plans";

const VALID_STEPS = ["choose-plan", "confirm-plan", "admin-credentials", "billing", "create-church", "done"];
const STEP_ORDER = ["choose-plan", "confirm-plan", "admin-credentials", "billing", "create-church", "done"];
const ALLOWED_STEP_TRANSITIONS: Record<string, string[]> = {
  "choose-plan": ["confirm-plan"],
  "confirm-plan": ["admin-credentials", "choose-plan"],
  "admin-credentials": ["billing", "confirm-plan"],
  "billing": ["create-church", "admin-credentials"],
  "create-church": ["billing"],
  "done": [],
};

function isHealthyBillingStatus(status: unknown): boolean {
  return status === "active" || status === "trialing";
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const {
      onboardingStep,
      onboardingComplete,
      planId,
    } = payload;

    if (
      Object.prototype.hasOwnProperty.call(payload, "churchId") ||
      Object.prototype.hasOwnProperty.call(payload, "stripeCustomerId") ||
      Object.prototype.hasOwnProperty.call(payload, "stripeSubscriptionId")
    ) {
      return NextResponse.json(
        { error: "Direct updates to church or Stripe identifiers are not allowed." },
        { status: 400 }
      );
    }

    if (onboardingStep && !VALID_STEPS.includes(onboardingStep)) {
      return NextResponse.json({ error: "Invalid onboarding step." }, { status: 400 });
    }

    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const uid = authUser.id;

    const { data: currentUser, error: currentUserError } = await adminDb
      .from("users")
      .select("id, onboarding_step, onboarding_complete, plan_id, billing_status, stripe_subscription_id")
      .eq("id", uid)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    const currentStep =
      typeof currentUser.onboarding_step === "string" && STEP_ORDER.includes(currentUser.onboarding_step)
        ? currentUser.onboarding_step
        : "choose-plan";

    if (currentUser.onboarding_complete === true) {
      return NextResponse.json(
        { error: "Onboarding is already completed and cannot be modified." },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (planId !== undefined) {
      const normalizedPlan = normalizePlanId(planId);
      if (!normalizedPlan) {
        return NextResponse.json({ error: "Invalid plan selection." }, { status: 400 });
      }

      if (currentStep === "create-church" || currentStep === "done") {
        return NextResponse.json(
          { error: "Plan cannot be changed after billing is completed." },
          { status: 403 }
        );
      }

      updateData.plan_id = normalizedPlan;
    }

    if (onboardingStep) {
      if (onboardingStep === "done") {
        return NextResponse.json(
          { error: "The done step can only be set by server-controlled completion flows." },
          { status: 403 }
        );
      }

      if (onboardingStep !== currentStep) {
        const allowedTargets = ALLOWED_STEP_TRANSITIONS[currentStep] ?? [];
        if (!allowedTargets.includes(onboardingStep)) {
          return NextResponse.json(
            { error: `Invalid onboarding transition from ${currentStep} to ${onboardingStep}.` },
            { status: 403 }
          );
        }
      }

      if (onboardingStep === "create-church") {
        const hasHealthyBilling =
          Boolean(currentUser.stripe_subscription_id) && isHealthyBillingStatus(currentUser.billing_status);
        if (!hasHealthyBilling) {
          return NextResponse.json(
            { error: "Active or trialing subscription required before church creation." },
            { status: 403 }
          );
        }
      }

      updateData.onboarding_step = onboardingStep;
    }

    if (typeof onboardingComplete === "boolean") {
      if (onboardingComplete === true) {
        return NextResponse.json(
          { error: "Onboarding completion cannot be set from this endpoint." },
          { status: 403 }
        );
      }
      updateData.onboarding_complete = false;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const { error } = await adminDb
      .from("users")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", uid);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update onboarding step error:", err);
    return NextResponse.json({ error: "Failed to update onboarding step" }, { status: 500 });
  }
}

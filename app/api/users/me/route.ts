// app/api/users/me/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { ROLE_PERMISSIONS } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";

function resolvePermissions(roles: Role[]) {
  const perms = new Set<string>();
  for (const role of roles) {
    const p = ROLE_PERMISSIONS[role] ?? [];
    p.forEach((perm) => perms.add(perm));
  }
  return Array.from(perms);
}

export async function GET() {
  try {
    const authUser = await getServerUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uid = authUser.id;

    const { data: user, error } = await adminDb
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles = (user.roles ?? []) as Role[];
    const permissions = resolvePermissions(roles);

    const onboardingComplete =
      user.onboarding_complete === undefined ? true : user.onboarding_complete;

    const onboardingStep = user.onboarding_step ?? "complete";

    return NextResponse.json({
      uid,
      email: user.email ?? null,
      firstName: user.first_name ?? null,
      lastName: user.last_name ?? null,
      profilePhotoUrl: user.profile_photo_url ?? null,
      planId: user.plan_id ?? null,
      stripeCustomerId: user.stripe_customer_id ?? null,
      stripeSubscriptionId: user.stripe_subscription_id ?? null,
      billingStatus: user.billing_status ?? null,
      billingDelinquent: user.billing_delinquent ?? null,
      billingUpdatedAt: user.billing_updated_at ?? null,

      roles,
      permissions,
      churchId: user.church_id ?? null,
      regionId: user.region_id ?? null,
      regionName: user.region_name ?? null,
      managedChurchIds: user.managed_church_ids ?? [],
      rolesByChurch: user.roles_by_church ?? {},

      onboardingStep,
      onboardingComplete,
    });
  } catch (err) {
    console.error("Error in /api/users/me:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

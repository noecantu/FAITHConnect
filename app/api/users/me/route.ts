// app/api/users/me/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { ROLE_PERMISSIONS, can } from "@/app/lib/auth/permissions";
import { ROLES, type Role } from "@/app/lib/auth/roles";

const ROOT_ADMIN_EMAIL = (process.env.ROOT_ADMIN_EMAIL ?? "root@faithconnect.app").toLowerCase();

function resolvePermissions(roles: Role[]) {
  const perms = new Set<string>();
  for (const role of roles) {
    const p = ROLE_PERMISSIONS[role] ?? [];
    p.forEach((perm) => perms.add(perm));
  }
  return Array.from(perms);
}

function normalizeRoles(raw: unknown): Role[] {
  const toCanonicalRole = (value: unknown): Role | null => {
    if (typeof value !== "string") return null;

    if (ROLES.includes(value as Role)) return value as Role;

    const key = value.toLowerCase().replace(/[\s_-]+/g, "");
    const aliases: Record<string, Role> = {
      rootadmin: "RootAdmin",
      systemadmin: "SystemAdmin",
      districtadmin: "DistrictAdmin",
      regionaladmin: "RegionalAdmin",
      support: "Support",
      auditor: "Auditor",
      admin: "Admin",
      finance: "Finance",
      eventmanager: "EventManager",
      attendancemanager: "AttendanceManager",
      membermanager: "MemberManager",
      servicemanager: "ServiceManager",
      pastor: "Pastor",
      minister: "Minister",
      deacon: "Deacon",
      musicmanager: "MusicManager",
      musicmember: "MusicMember",
      ushermanager: "UsherManager",
      usher: "Usher",
      caretakermanager: "CaretakerManager",
      caretaker: "Caretaker",
      mensgroupmanager: "MensGroupManager",
      mensgroup: "MensGroup",
      womensgroupmanager: "WomensGroupManager",
      womensgroup: "WomensGroup",
      youthgroupmanager: "YouthGroupManager",
      youthgroup: "YouthGroup",
      groupmanager: "GroupManager",
      member: "Member",
    };

    return aliases[key] ?? null;
  };

  if (typeof raw === "string") {
    const role = toCanonicalRole(raw);
    return role ? [role] : [];
  }

  if (!Array.isArray(raw)) return [];

  const out = new Set<Role>();
  raw.forEach((r) => {
    const role = toCanonicalRole(r);
    if (role) out.add(role);
  });
  return Array.from(out);
}

function mergeRoles(...roleSources: unknown[]): Role[] {
  const merged = new Set<Role>();
  roleSources.forEach((src) => {
    normalizeRoles(src).forEach((role) => merged.add(role));
  });
  return Array.from(merged);
}

function applyRootBootstrapRoles(email: string | null | undefined, roles: Role[]): Role[] {
  if (!email) return roles;
  if (roles.length > 0) return roles;

  if (email.toLowerCase() === ROOT_ADMIN_EMAIL) {
    return ["RootAdmin"];
  }

  return roles;
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
      // Fallback for system users that exist in Auth before profile row creation.
      const metadata = authUser.user_metadata ?? {};
      const appMetadata = authUser.app_metadata ?? {};

      const roles = normalizeRoles(
        (metadata as Record<string, unknown>).roles ??
          (appMetadata as Record<string, unknown>).roles
      );
      const effectiveRoles = applyRootBootstrapRoles(authUser.email ?? null, roles);
      const permissions = resolvePermissions(effectiveRoles);
      const isSystemUser = can(effectiveRoles, "system.manage");

      return NextResponse.json({
        uid,
        email: authUser.email ?? null,
        firstName: (metadata as Record<string, unknown>).firstName ?? null,
        lastName: (metadata as Record<string, unknown>).lastName ?? null,
        profilePhotoUrl: null,
        planId: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        billingStatus: null,
        billingDelinquent: null,
        billingUpdatedAt: null,

        roles: effectiveRoles,
        permissions,
        churchId:
          ((metadata as Record<string, unknown>).churchId as string | null | undefined) ??
          ((metadata as Record<string, unknown>).church_id as string | null | undefined) ??
          null,
        regionId:
          ((metadata as Record<string, unknown>).regionId as string | null | undefined) ??
          ((metadata as Record<string, unknown>).region_id as string | null | undefined) ??
          null,
        regionName: null,
        managedChurchIds: [],
        rolesByChurch: {},

        onboardingStep: isSystemUser ? "complete" : "choose-plan",
        onboardingComplete: isSystemUser,
      });
    }

    const metadata = authUser.user_metadata ?? {};
    const appMetadata = authUser.app_metadata ?? {};

    const roles = mergeRoles(
      user.roles,
      (metadata as Record<string, unknown>).roles,
      (metadata as Record<string, unknown>).role,
      (appMetadata as Record<string, unknown>).roles,
      (appMetadata as Record<string, unknown>).role
    );
    const effectiveRoles = applyRootBootstrapRoles(authUser.email ?? null, roles);
    const permissions = resolvePermissions(effectiveRoles);
    const isSystemUser = can(effectiveRoles, "system.manage");

    const onboardingComplete = isSystemUser
      ? true
      : (user.onboarding_complete === undefined ? true : user.onboarding_complete);

    const onboardingStep = isSystemUser ? "complete" : (user.onboarding_step ?? "complete");

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

      roles: effectiveRoles,
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

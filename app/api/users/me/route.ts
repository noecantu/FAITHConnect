// app/api/users/me/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { ROLE_PERMISSIONS, can } from "@/app/lib/auth/permissions";
import { ROLES, type Role } from "@/app/lib/auth/roles";

const ROOT_ADMIN_EMAIL = (
  process.env.ROOT_ADMIN_EMAIL ??
  process.env.NEXT_PUBLIC_ROOT_ADMIN_EMAIL ??
  process.env.ROOT_ADMIN_USER_EMAIL ??
  process.env.ROOTADMIN_EMAIL ??
  "root@faithconnect.app"
)
  .trim()
  .toLowerCase();

function resolvePermissions(roles: Role[], explicitGrants: string[] = []) {
  const perms = new Set<string>();
  // Role-derived permissions
  for (const role of roles) {
    const p = ROLE_PERMISSIONS[role] ?? [];
    p.forEach((perm) => perms.add(perm));
  }
  // Explicit per-user grants override/augment role-based permissions
  for (const grant of explicitGrants) {
    perms.add(grant);
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
      rootadministrator: "RootAdmin",
      systemadmin: "SystemAdmin",
      systemadministrator: "SystemAdmin",
      districtadmin: "DistrictAdmin",
      districtadministrator: "DistrictAdmin",
      regionaladmin: "RegionalAdmin",
      regionaladministrator: "RegionalAdmin",
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
  if (email.toLowerCase() === ROOT_ADMIN_EMAIL) {
    const merged = new Set<Role>(roles);
    merged.add("RootAdmin");
    return Array.from(merged);
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

    const { data: linkedMembers } = await adminDb
      .from("members")
      .select("id")
      .eq("user_id", uid);

    const memberIds = (linkedMembers ?? [])
      .map((member) => (typeof member.id === "string" ? member.id : null))
      .filter((memberId): memberId is string => Boolean(memberId));

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
          (metadata as Record<string, unknown>).role ??
          (metadata as Record<string, unknown>).user_role ??
          (appMetadata as Record<string, unknown>).roles ??
          (appMetadata as Record<string, unknown>).role ??
          (appMetadata as Record<string, unknown>).user_role
      );
      const effectiveRoles = applyRootBootstrapRoles(authUser.email ?? null, roles);
      const permissions = resolvePermissions(effectiveRoles, []);
      const isSystemUser = can(effectiveRoles, "system.manage");
      const isRootAdmin =
        (authUser.email ?? "").trim().toLowerCase() === ROOT_ADMIN_EMAIL;

      // If we bootstrapped a RootAdmin role, persist it so RLS policies work
      if (
        effectiveRoles.includes("RootAdmin") &&
        (authUser.email ?? "").trim().toLowerCase() === ROOT_ADMIN_EMAIL
      ) {
        await adminDb.from("users").upsert(
          {
            id: uid,
            email: authUser.email,
            roles: effectiveRoles,
            first_name: (metadata as Record<string, unknown>).firstName as string ?? "Root",
            last_name: (metadata as Record<string, unknown>).lastName as string ?? "Admin",
            onboarding_step: "complete",
            onboarding_complete: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      }

      return NextResponse.json({
        id: uid,
        uid,
        email: authUser.email ?? null,
        firstName: (metadata as Record<string, unknown>).firstName ?? null,
        lastName: (metadata as Record<string, unknown>).lastName ?? null,
        memberIds,
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
        districtId:
          ((metadata as Record<string, unknown>).districtId as string | null | undefined) ??
          ((metadata as Record<string, unknown>).district_id as string | null | undefined) ??
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
        isSystemUser,
        isRootAdmin,
      });
    }

    const metadata = authUser.user_metadata ?? {};
    const appMetadata = authUser.app_metadata ?? {};

    const roles = mergeRoles(
      user.roles,
      (user as Record<string, unknown>).role,
      (user as Record<string, unknown>).user_role,
      (metadata as Record<string, unknown>).roles,
      (metadata as Record<string, unknown>).role,
      (metadata as Record<string, unknown>).user_role,
      (appMetadata as Record<string, unknown>).roles,
      (appMetadata as Record<string, unknown>).role,
      (appMetadata as Record<string, unknown>).user_role
    );
    const effectiveRoles = applyRootBootstrapRoles(authUser.email ?? null, roles);
    const explicitGrants: string[] = Array.isArray(user.permissions) ? user.permissions : [];
    const permissions = resolvePermissions(effectiveRoles, explicitGrants);
    const isSystemUser = can(effectiveRoles, "system.manage");
    const isRootAdmin =
      (authUser.email ?? "").trim().toLowerCase() === ROOT_ADMIN_EMAIL;

    // If the DB row has no roles but we bootstrapped RootAdmin, persist it
    const dbRoles = normalizeRoles(user.roles);
    if (
      effectiveRoles.includes("RootAdmin") &&
      (authUser.email ?? "").trim().toLowerCase() === ROOT_ADMIN_EMAIL &&
      !dbRoles.includes("RootAdmin")
    ) {
      await adminDb
        .from("users")
        .update({ roles: effectiveRoles, updated_at: new Date().toISOString() })
        .eq("id", uid);
    }

    const onboardingComplete = isSystemUser
      ? true
      : (typeof user.onboarding_complete === "boolean" ? user.onboarding_complete : false);

    const onboardingStep = isSystemUser
      ? "complete"
      : (user.onboarding_step ?? (onboardingComplete ? "complete" : "choose-plan"));

    if (isSystemUser && (user.onboarding_complete !== true || user.onboarding_step !== "complete")) {
      await adminDb
        .from("users")
        .update({ onboarding_complete: true, onboarding_step: "complete", updated_at: new Date().toISOString() })
        .eq("id", uid);
    }

    return NextResponse.json({
      id: uid,
      uid,
      email: user.email ?? null,
      firstName: user.first_name ?? null,
      lastName: user.last_name ?? null,
      memberIds,
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
      districtId: user.district_id ?? null,
      regionId: user.region_id ?? null,
      regionName: user.region_name ?? null,
      managedChurchIds: user.managed_church_ids ?? [],
      rolesByChurch: user.roles_by_church ?? {},

      onboardingStep,
      onboardingComplete,
      isSystemUser,
      isRootAdmin,
    });
  } catch (err) {
    console.error("Error in /api/users/me:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

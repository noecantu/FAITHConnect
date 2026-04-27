"use server";

import { adminDb } from "@/app/lib/supabase/admin";
import { logSystemEvent } from "@/app/lib/system/logging";
import { Role, SystemRole, ALL_ROLES, SYSTEM_ROLE_LIST } from "@/app/lib/auth/roles";
import { can } from "@/app/lib/auth/permissions";
import { nanoid } from "nanoid";

export interface UpdateUserInput {
  userId: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  roles?: Role[] | SystemRole[];
  church_id?: string | null;
  regionName?: string | null;
  region_id?: string | null;
  districtName?: string | null;
  district_id?: string | null;
  districtTitle?: string | null;
  districtState?: string | null;
  actorUid: string;
  actorName?: string | null;
}

export async function updateUserAction(input: UpdateUserInput) {
  const { userId, actorUid, actorName, roles: newRoles, ...updates } = input;

  const [{ data: targetData }, { data: actorData }] = await Promise.all([
    adminDb.from("users").select("*").eq("id", userId).single(),
    adminDb.from("users").select("*").eq("id", actorUid).single(),
  ]);

  if (!targetData) throw new Error("User not found");
  if (!actorData) throw new Error("Actor not found");

  const ROOT_ADMIN_EMAIL = (
    process.env.ROOT_ADMIN_EMAIL ??
    process.env.NEXT_PUBLIC_ROOT_ADMIN_EMAIL ??
    "root@faithconnect.app"
  ).trim().toLowerCase();

  const before = targetData;
  let actorRoles = (actorData.roles ?? []) as Role[];

  // Bootstrap RootAdmin role from email if not already present in DB
  if (
    actorData.email?.trim().toLowerCase() === ROOT_ADMIN_EMAIL &&
    !(actorRoles as string[]).includes("RootAdmin")
  ) {
    actorRoles = [...actorRoles, "RootAdmin" as unknown as Role];
  }

  const isSelf = actorUid === userId;
  const isRootAdmin = can(actorRoles, "system.manage");
  const canAssignRoles = can(actorRoles, "roles.assign");

  let isSystemRoleUpdate = false;
  let isChurchRoleUpdate = false;

  if (newRoles) {
    isSystemRoleUpdate = newRoles.every((r) => SYSTEM_ROLE_LIST.includes(r as Role));
    isChurchRoleUpdate = newRoles.every((r) => ALL_ROLES.includes(r as Role) && !SYSTEM_ROLE_LIST.includes(r as Role));
    if (!isSystemRoleUpdate && !isChurchRoleUpdate) throw new Error("Invalid role assignment.");
  }

  if (!isRootAdmin && actorData.church_id !== before.church_id) {
    throw new Error("You cannot modify users from another church.");
  }

  if (newRoles && !canAssignRoles) throw new Error("You do not have permission to assign roles.");

  if (newRoles && isSelf) {
    const currentRoles = [...(before.roles ?? [])].sort();
    const normalizedNew = [...newRoles].sort();
    const rolesChanged = currentRoles.length !== normalizedNew.length || currentRoles.some((r, i) => r !== normalizedNew[i]);
    if (rolesChanged) throw new Error("You cannot change your own roles.");
  }

  if (newRoles?.includes("RootAdmin") && !isRootAdmin) {
    throw new Error("Only RootAdmin can assign the RootAdmin role.");
  }

  if (newRoles && isChurchRoleUpdate) {
    const churchRoles = newRoles as Role[];
    const targetIsAdmin = before.roles?.includes("Admin");
    const removingAdmin = targetIsAdmin && !churchRoles.includes("Admin");

    if (isSelf && removingAdmin && !isRootAdmin) throw new Error("You cannot remove your own Admin role.");

    if (removingAdmin && !isRootAdmin) {
      const { data: admins } = await adminDb.from("users").select("id").eq("church_id", before.church_id).contains("roles", ["Admin"]);
      const otherAdmins = (admins ?? []).filter((a: { id: string }) => a.id !== userId);
      if (otherAdmins.length === 0) throw new Error("You cannot remove the last Admin from this church.");
    }
  }

  const finalUpdates: Record<string, unknown> = { ...updates };
  if (newRoles) finalUpdates.roles = newRoles;

  const hasRegionalAdmin = newRoles?.includes("RegionalAdmin");
  if (newRoles && hasRegionalAdmin) {
    const regionName = input.regionName?.trim();
    if (!regionName) throw new Error("Region name required for Regional Admin.");

    const { data: existingRegion } = await adminDb.from("regions").select("id").eq("name", regionName).limit(1).single();

    let region_id: string;
    if (existingRegion) {
      region_id = existingRegion.id;
      await adminDb.from("regions").update({
        region_admin_id: userId,
        region_admin_name: `${before.first_name ?? ""} ${before.last_name ?? ""}`.trim(),
      }).eq("id", region_id);
    } else {
      region_id = nanoid();
      await adminDb.from("regions").insert({
        id: region_id,
        name: regionName,
        region_admin_id: userId,
        region_admin_name: `${before.first_name ?? ""} ${before.last_name ?? ""}`.trim(),
        created_by: actorUid,
        created_at: new Date().toISOString(),
      });
    }
    finalUpdates.region_id = region_id;
  } else if (newRoles && !newRoles.includes("RegionalAdmin")) {
    finalUpdates.region_id = null;
  }

  const hasDistrictAdmin = newRoles?.includes("DistrictAdmin");
  if (newRoles && hasDistrictAdmin) {
    const districtName = input.districtName?.trim();
    if (!districtName) throw new Error("District name required for District Admin.");

    const { data: existingDistrict } = await adminDb.from("districts").select("id").eq("name", districtName).limit(1).single();

    let district_id: string;
    if (existingDistrict) {
      district_id = existingDistrict.id;
      await adminDb.from("districts").update({
        region_admin_id: userId,
        region_admin_name: `${before.first_name ?? ""} ${before.last_name ?? ""}`.trim(),
        region_admin_title: input.districtTitle?.trim() ?? null,
        state: input.districtState?.trim() ?? null,
      }).eq("id", district_id);
    } else {
      district_id = nanoid();
      await adminDb.from("districts").insert({
        id: district_id,
        name: districtName,
        region_admin_id: userId,
        region_admin_name: `${before.first_name ?? ""} ${before.last_name ?? ""}`.trim(),
        region_admin_title: input.districtTitle?.trim() ?? null,
        state: input.districtState?.trim() ?? null,
        created_by: actorUid,
        created_at: new Date().toISOString(),
      });
    }
    finalUpdates.district_id = district_id;
  } else if (newRoles && !newRoles.includes("DistrictAdmin")) {
    finalUpdates.district_id = null;
  }

  const { error: updateError } = await adminDb.from("users").update(finalUpdates).eq("id", userId);
  if (updateError) throw new Error(updateError.message);

  await logSystemEvent({
    type: "USER_UPDATED",
    actorUid,
    actorName,
    targetId: userId,
    targetType: "USER",
    message: `Updated user: ${before.email ?? "Unknown"}`,
    before,
    after: { ...before, ...finalUpdates },
  });

  return { success: true };
}

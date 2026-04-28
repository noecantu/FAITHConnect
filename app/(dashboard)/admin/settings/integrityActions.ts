// app/(dashboard)/admin/settings/integrityActions.ts
"use server";

import { adminDb } from "@/app/lib/supabase/admin";
import { SystemUser } from "@/app/lib/types";
import { ALL_ROLES, CHURCH_ROLES, SYSTEM_ROLES } from "@/app/lib/auth/roles";
import { getCurrentUser } from "@/app/lib/auth/server/getCurrentUser";
import { can } from "@/app/lib/auth/permissions";
import { logSystemEvent } from "@/app/lib/system/logging";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnv } from "@/app/lib/supabase/env";

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const { url, serviceRoleKey } = getSupabaseAdminEnv();
    supabaseAdmin = createClient(
      url,
      serviceRoleKey
    );
  }
  return supabaseAdmin;
}

function isChurchActiveForIntegrity(data: Record<string, unknown>): boolean {
  const rawStatus = typeof data.status === "string" ? data.status.trim().toLowerCase() : "";
  const explicitInactive = new Set(["disabled", "inactive", "archived", "suspended"]);
  if (typeof data.active === "boolean") return data.active;
  if (!rawStatus) return true;
  if (explicitInactive.has(rawStatus)) return false;
  return true;
}

async function requireSystemManager() {
  const actor = await getCurrentUser();
  if (!actor || !can(actor.roles ?? [], "system.manage")) throw new Error("Unauthorized");
  return actor;
}

export async function scanForStrayUsers() {
  await requireSystemManager();

  const [{ data: usersData }, { data: churchesData }] = await Promise.all([
    adminDb.from("users").select("id, roles, church_id, email, first_name, last_name"),
    adminDb.from("churches").select("id"),
  ]);

  const churchIds = new Set((churchesData ?? []).map((c) => c.id));

  return (usersData ?? []).filter((u) => {
    const roles: string[] = u.roles || [];
    if (roles.some((r) => SYSTEM_ROLES.includes(r as any))) return false;
    const hasChurchRoles = roles.some((r) => CHURCH_ROLES.includes(r as any));
    if (hasChurchRoles) return !u.church_id || !churchIds.has(u.church_id);
    return true;
  }).map((u) => ({ uid: u.id, ...u }));
}

export async function deleteStrayUser(uid: string) {
  const actor = await requireSystemManager();
  if (!uid) throw new Error("Missing uid.");
  if (actor.uid === uid) throw new Error("You cannot delete your own account.");

  const { data: userData } = await adminDb.from("users").select("church_id").eq("id", uid).single();
  if (!userData) throw new Error("User not found.");

  if (userData.church_id) {
    const { data: church } = await adminDb.from("churches").select("billing_owner_uid, created_by").eq("id", userData.church_id).single();
    if (church) {
      const billingOwner = church.billing_owner_uid ?? church.created_by ?? null;
      if (billingOwner === uid) throw new Error("This user is the billing owner for this church.");
    }
  }

  const { error } = await getSupabaseAdmin().auth.admin.deleteUser(uid);
  if (error && !error.message.includes("not found")) throw error;
  await adminDb.from("users").delete().eq("id", uid);

  return { success: true, uid };
}

export async function scanForOrphanedMembers() {
  await requireSystemManager();

  const [{ data: churchesData }, { data: usersData }, { data: membersData }] = await Promise.all([
    adminDb.from("churches").select("id, name, status, active"),
    adminDb.from("users").select("id"),
    adminDb.from("members").select("id, church_id, first_name, last_name, user_id"),
  ]);

  const activeChurchIds = new Set(
    (churchesData ?? [])
      .filter((c) => isChurchActiveForIntegrity(c as Record<string, unknown>))
      .map((c) => c.id)
  );
  const userIds = new Set((usersData ?? []).map((u) => u.id));
  const churchNameById = new Map((churchesData ?? []).map((c) => [c.id, c.name ?? c.id]));

  return (membersData ?? [])
    .filter((m) => {
      if (!activeChurchIds.has(m.church_id)) return true;
      if (m.user_id && !userIds.has(m.user_id)) return true;
      return false;
    })
    .map((m) => ({
      churchId: m.church_id,
      churchName: churchNameById.get(m.church_id) ?? m.church_id,
      memberId: m.id,
      memberName: `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "Unnamed member",
      linkedUserId: m.user_id ?? null,
      reason: !activeChurchIds.has(m.church_id) ? "inactive-church" : "dangling-user-link",
    }));
}

export async function deleteOrphanedMember(churchId: string, memberId: string) {
  await requireSystemManager();
  if (!churchId || !memberId) throw new Error("Missing parameters.");

  const { data } = await adminDb.from("members").select("id").eq("id", memberId).eq("church_id", churchId).single();
  if (!data) throw new Error("Member not found.");

  await adminDb.from("members").delete().eq("id", memberId);
  return { success: true, churchId, memberId };
}

export async function scanForChurchesWithoutAdmins() {
  await requireSystemManager();

  const [{ data: churchesData }, { data: usersData }] = await Promise.all([
    adminDb.from("churches").select("*"),
    adminDb.from("users").select("id, roles, church_id"),
  ]);

  return (churchesData ?? []).filter((church) => {
    const admins = (usersData ?? []).filter(
      (u) => u.church_id === church.id && (u.roles ?? []).includes("Admin")
    );
    return admins.length === 0;
  });
}

export async function scanForInvalidRoles() {
  await requireSystemManager();

  const { data: usersData } = await adminDb.from("users").select("id, roles");

  return (usersData ?? [])
    .filter((u) => {
      const roles: string[] = u.roles || [];
      return roles.some((r) => !ALL_ROLES.includes(r as any));
    })
    .map((u) => ({
      uid: u.id,
      roles: u.roles,
      invalidRoles: (u.roles ?? []).filter((r: string) => !ALL_ROLES.includes(r as any)),
      validRoles: (u.roles ?? []).filter((r: string) => ALL_ROLES.includes(r as any)),
    }));
}

export async function repairInvalidUserRoles(uid: string) {
  await requireSystemManager();
  if (!uid) throw new Error("Missing uid.");

  const { data: userData } = await adminDb.from("users").select("roles").eq("id", uid).single();
  if (!userData) throw new Error("User not found.");

  const filteredRoles = Array.from(new Set(
    (userData.roles ?? []).filter((r: string) => ALL_ROLES.includes(r as any))
  ));

  await adminDb.from("users").update({ roles: filteredRoles }).eq("id", uid);
  return { success: true, uid, roles: filteredRoles };
}

export async function scanForStrayAuthUsers() {
  await requireSystemManager();

  const { data: { users: authUsers } } = await getSupabaseAdmin().auth.admin.listUsers();
  const { data: dbUsers } = await adminDb.from("users").select("id");
  const dbUserIds = new Set((dbUsers ?? []).map((u) => u.id));

  return authUsers
    .filter((u) => !dbUserIds.has(u.id))
    .map((u) => ({
      uid: u.id,
      email: u.email ?? null,
      disabled: !u.email_confirmed_at,
      creationTime: u.created_at ?? null,
    }));
}

export async function deleteStrayAuthUser(uid: string) {
  const actor = await requireSystemManager();
  if (!uid) throw new Error("Missing uid.");
  if (actor.uid === uid) throw new Error("You cannot delete your own auth account.");

  const { data: dbUser } = await adminDb.from("users").select("id").eq("id", uid).single();
  if (dbUser) throw new Error("This uid has a user profile. Use standard user deletion instead.");

  const { error } = await getSupabaseAdmin().auth.admin.deleteUser(uid);
  if (error) throw error;
  return { success: true, uid };
}

export async function normalizeUserUids() {
  const actor = await requireSystemManager();

  // In Supabase, user IDs are already UUID from auth.users — nothing to normalize
  // Just log that the operation was requested
  await logSystemEvent({
    type: "SYSTEM_EVENT",
    actorUid: actor.uid,
    actorName: `${actor.firstName ?? ""} ${actor.lastName ?? ""}`.trim() || actor.email,
    targetType: "SYSTEM",
    message: "Normalize user UIDs: no-op in Supabase (IDs already normalized).",
    metadata: { scanned: 0, touched: 0 },
  });

  return { scanned: 0, touched: 0, addedUid: 0, correctedUid: 0, removedLegacyId: 0, changedUsers: [] };
}

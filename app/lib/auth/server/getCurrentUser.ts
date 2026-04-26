// This is a compatibility shim that wraps the new Supabase-based getServerUser
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";
import type { AppUser } from "@/app/lib/types";
import { ROLES, type Role } from "@/app/lib/auth/roles";

const ROOT_ADMIN_EMAIL = (process.env.ROOT_ADMIN_EMAIL ?? "root@faithconnect.app").toLowerCase();

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

export async function getCurrentUser(): Promise<AppUser | null> {
  const user = await getServerUser();
  if (!user) return null;

  const { data } = await adminDb
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!data) {
    const metadata = user.user_metadata ?? {};
    const appMetadata = user.app_metadata ?? {};

    return {
      uid: user.id,
      email: user.email ?? "",
      firstName: ((metadata as Record<string, unknown>).firstName as string | null | undefined) ?? null,
      lastName: ((metadata as Record<string, unknown>).lastName as string | null | undefined) ?? null,
      profilePhotoUrl: null,
      churchId:
        ((metadata as Record<string, unknown>).churchId as string | null | undefined) ??
        ((metadata as Record<string, unknown>).church_id as string | null | undefined) ??
        null,
      regionId:
        ((metadata as Record<string, unknown>).regionId as string | null | undefined) ??
        ((metadata as Record<string, unknown>).region_id as string | null | undefined) ??
        null,
      districtId:
        ((metadata as Record<string, unknown>).districtId as string | null | undefined) ??
        ((metadata as Record<string, unknown>).district_id as string | null | undefined) ??
        null,
      roles: applyRootBootstrapRoles(
        user.email ?? null,
        mergeRoles(
        (metadata as Record<string, unknown>).roles ??
          (appMetadata as Record<string, unknown>).roles,
        (metadata as Record<string, unknown>).role,
        (appMetadata as Record<string, unknown>).role
      )),
      settings: {},
    };
  }

  const metadata = user.user_metadata ?? {};
  const appMetadata = user.app_metadata ?? {};

  return {
    uid: data.id,
    email: data.email,
    firstName: data.first_name ?? null,
    lastName: data.last_name ?? null,
    profilePhotoUrl: data.profile_photo_url ?? null,
    churchId: data.church_id ?? null,
    regionId: data.region_id ?? null,
    districtId: data.district_id ?? null,
    roles: applyRootBootstrapRoles(
      user.email ?? null,
      mergeRoles(
      data.roles,
      (metadata as Record<string, unknown>).roles,
      (metadata as Record<string, unknown>).role,
      (appMetadata as Record<string, unknown>).roles,
      (appMetadata as Record<string, unknown>).role
    )),
    settings: data.settings ?? {},
  };
}
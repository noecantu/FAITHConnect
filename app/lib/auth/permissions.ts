// app/lib/auth/permissions.ts

export type Permission =
  | "church.manage"
  | "messages.read"
  | "messages.manage"
  | "members.read"
  | "members.manage"
  | "contributions.read"
  | "contributions.manage"
  | "events.read"
  | "events.manage"
  | "music.read"
  | "music.manage"
  | "setlists.read"
  | "setlists.manage"
  | "songs.read"
  | "songs.manage"
  | "servicePlans.read"
  | "servicePlans.manage"
  | "attendance.read"
  | "attendance.manage"
  | "roles.assign"
  | "system.manage"
  | "district.manage"
  | "region.manage"
  | "reports.read"
  | "reports.attendance"
  | "reports.contributions"
  | "reports.members"
  | "reports.setlists"
  | "reports.serviceplans";

import type { Role } from "./roles";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  RootAdmin: [
    "system.manage",
    "region.manage",
    "church.manage",
    "messages.manage",
    "roles.assign",
    "members.manage",
    "contributions.manage",
    "events.manage",
    "music.manage",
    "servicePlans.manage",
    "attendance.manage",
    "reports.read",
  ],

  SystemAdmin: [
    "system.manage",
    "church.manage",
    "messages.manage",
    "roles.assign",
    "members.manage",
    "contributions.manage",
    "events.manage",
    "music.manage",
    "servicePlans.manage",
    "attendance.manage",
    "reports.read",
  ],

  RegionalAdmin: [
    "region.manage",
    "roles.assign",
    "messages.read",
    "members.read",
    "contributions.read",
    "events.read",
    "servicePlans.read",
    "attendance.read",
    "music.read",
    "reports.read",
  ],

  DistrictAdmin: [
    "district.manage",
    "region.manage",
    "roles.assign",
    "messages.read",
    "members.read",
    "contributions.read",
    "events.read",
    "servicePlans.read",
    "attendance.read",
    "music.read",
    "reports.read",
  ],

  Support: [
    "members.read",
    "events.read",
    "attendance.read",
  ],

  Auditor: [
    "members.read",
    "contributions.read",
    "events.read",
    "servicePlans.read",
    "attendance.read",
    "music.read",
    "reports.read",
  ],

  Admin: [
    "church.manage",
    "messages.manage",
    "roles.assign",
    "members.manage",
    "contributions.manage",
    "events.manage",
    "music.manage",
    "servicePlans.manage",
    "attendance.manage",
    "reports.read",
  ],

  // Church roles with communication responsibility get message edit access by default.
  // Additional access can still be granted explicitly per user via the permissions column.
  Finance: [],
  EventManager: [
    "messages.manage",
  ],
  AttendanceManager: [],
  MemberManager: [],
  ServiceManager: [
    "messages.manage",
  ],

  Pastor: [
    "messages.manage",
  ],
  Minister: [
    "messages.manage",
  ],
  Deacon: [
    "messages.manage",
  ],

  MusicManager: [],
  MusicMember: [],

  UsherManager: [],
  Usher: [],

  CaretakerManager: [],
  Caretaker: [],

  MensGroupManager: [],
  MensGroup: [],

  WomensGroupManager: [],
  WomensGroup: [],

  YouthGroupManager: [],
  YouthGroup: [],

  GroupManager: [],
  Member: [],
};

export function can(roles: Role[], permission: Permission, grants?: Permission[]): boolean {
  // 1. Check explicit per-user grants first
  if (grants && grants.length > 0) {
    if (grants.includes(permission)) return true;

    // manage implies read
    if (permission.endsWith(".read")) {
      const manageVersion = permission.replace(".read", ".manage") as Permission;
      if (grants.includes(manageVersion)) return true;
    }

    // reports.read is satisfied by any specific report grant
    if (permission === "reports.read") {
      if (grants.some((g) =>
        g === "reports.attendance" ||
        g === "reports.contributions" ||
        g === "reports.members" ||
        g === "reports.setlists" ||
        g === "reports.serviceplans"
      )) return true;
    }

    // Specific report sub-permissions are satisfied by the umbrella reports.read grant
    if (
      permission === "reports.attendance" ||
      permission === "reports.contributions" ||
      permission === "reports.members" ||
      permission === "reports.setlists" ||
      permission === "reports.serviceplans"
    ) {
      if (grants.includes("reports.read")) return true;
    }

    // music.manage/read umbrella satisfies granular setlists/songs permissions
    if (
      permission === "setlists.read" || permission === "setlists.manage" ||
      permission === "songs.read" || permission === "songs.manage"
    ) {
      if (grants.includes("music.manage")) return true;
      if (
        (permission === "setlists.read" || permission === "songs.read") &&
        grants.includes("music.read")
      ) return true;
    }
  }

  // 2. Fall back to role-based permissions
  return roles.some(role => {
    const perms = ROLE_PERMISSIONS[role] ?? [];

    // direct match
    if (perms.includes(permission)) return true;

    // manage implies read
    if (permission.endsWith(".read")) {
      const manageVersion = permission.replace(".read", ".manage");
      if (perms.includes(manageVersion as Permission)) return true;
    }

    // roles with reports.read also satisfy specific report sub-permissions
    if (
      permission === "reports.attendance" ||
      permission === "reports.contributions" ||
      permission === "reports.members" ||
      permission === "reports.setlists" ||
      permission === "reports.serviceplans"
    ) {
      return perms.includes("reports.read");
    }

    // music.manage/read umbrella satisfies granular setlists/songs permissions
    if (
      permission === "setlists.read" || permission === "setlists.manage" ||
      permission === "songs.read" || permission === "songs.manage"
    ) {
      if (perms.includes("music.manage")) return true;
      if (
        (permission === "setlists.read" || permission === "songs.read") &&
        perms.includes("music.read")
      ) return true;
    }

    return false;
  });
}
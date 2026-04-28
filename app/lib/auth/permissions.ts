// app/lib/auth/permissions.ts

export type Permission =
  | "church.manage"
  | "members.read"
  | "members.manage"
  | "contributions.read"
  | "contributions.manage"
  | "events.read"
  | "events.manage"
  | "music.read"
  | "music.manage"
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
    "roles.assign",
    "members.manage",
    "contributions.manage",
    "events.manage",
    "music.manage",
    "servicePlans.manage",
    "attendance.manage",
    "reports.read",
  ],

  // Church-member roles are organizational titles only.
  // Actual module access is granted explicitly per user via the permissions column.
  Finance: [],
  EventManager: [],
  AttendanceManager: [],
  MemberManager: [],
  ServiceManager: [],

  Pastor: [],
  Minister: [],
  Deacon: [],

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

    return false;
  });
}
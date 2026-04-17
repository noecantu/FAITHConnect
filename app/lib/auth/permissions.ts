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
  | "region.manage"
  | "reports.read";

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

  Finance: ["contributions.manage", "reports.read"],
  EventManager: ["events.manage"],
  AttendanceManager: ["attendance.manage"],
  MemberManager: ["members.manage"],
  ServiceManager: ["servicePlans.manage"],

  Pastor: ["members.read", "events.read", "servicePlans.read"],
  Minister: ["members.read", "events.read"],
  Deacon: ["members.read"],

  MusicManager: ["music.manage"],
  MusicMember: ["music.read"],

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

export function can(roles: Role[], permission: Permission): boolean {
  return roles.some(role => {
    const perms = ROLE_PERMISSIONS[role] ?? [];

    // direct match
    if (perms.includes(permission)) return true;

    // manage implies read
    if (permission.endsWith(".read")) {
      const manageVersion = permission.replace(".read", ".manage");
      return perms.includes(manageVersion as Permission);
    }

    return false;
  });
}
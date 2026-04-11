// app/lib/auth/permissions.ts
// New with redundancy Removal

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
  | "regional.manage";

import type { Role } from "./roles";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // System roles
  RootAdmin: [
    "system.manage",
    "roles.assign",
    "church.manage",
    "members.manage",
    "contributions.manage",
    "events.manage",
    "music.manage",
    "servicePlans.manage",
    "attendance.manage",
  ],

  SystemAdmin: [
    "system.manage",
    "roles.assign",
  ],

  RegionalAdmin: [
    "roles.assign",
    "regional.manage",
  ],

  Support: [
    "members.read",
    "events.read",
    "servicePlans.read",
  ],

  Auditor: [
    "members.read",
    "contributions.read",
    "events.read",
    "music.read",
    "servicePlans.read",
    "attendance.read",
  ],

  // Church roles
  Admin: [
    "church.manage",
    "roles.assign",
    "members.read",
    "members.manage",
    "contributions.read",
    "contributions.manage",
    "events.read",
    "events.manage",
    "music.read",
    "music.manage",
    "servicePlans.read",
    "servicePlans.manage",
    "attendance.read",
    "attendance.manage",
  ],

  Finance: ["contributions.read", "contributions.manage"],
  EventManager: ["events.read", "events.manage"],
  AttendanceManager: ["attendance.read", "attendance.manage"],
  MemberManager: ["members.read", "members.manage"],
  ServiceManager: ["servicePlans.read", "servicePlans.manage"],

  Pastor: [
    "members.read",
    "events.read",
    "servicePlans.read",
  ],

  Minister: [
    "members.read",
    "events.read",
  ],

  Deacon: [
    "members.read",
    "events.read",
  ],

  MusicManager: ["music.read", "music.manage"],
  MusicMember: ["music.read"],

  // Group roles — give them read-only access
  UsherManager: ["events.read"],
  Usher: ["events.read"],

  CaretakerManager: ["events.read"],
  Caretaker: ["events.read"],

  MensGroupManager: ["events.read"],
  MensGroup: ["events.read"],

  WomensGroupManager: ["events.read"],
  WomensGroup: ["events.read"],

  YouthGroupManager: ["events.read"],
  YouthGroup: ["events.read"],

  GroupManager: ["events.read"],
  Member: ["events.read", "servicePlans.read"],
};

export function can(roles: Role[], permission: Permission): boolean {
  return roles.some(r => ROLE_PERMISSIONS[r]?.includes(permission));
}

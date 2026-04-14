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
  | "region.manage";

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
  ],

  Finance: ["contributions.manage"],
  EventManager: ["events.manage"],
  AttendanceManager: ["attendance.manage"],
  MemberManager: ["members.manage"],
  ServiceManager: ["servicePlans.manage"],

  Pastor: ["members.read", "events.read", "servicePlans.read"],
  Minister: ["members.read", "events.read"],
  Deacon: ["members.read"],

  MusicManager: ["music.manage"],
  MusicMember: ["music.read"],

  UsherManager: ["attendance.manage"],
  Usher: ["attendance.read"],

  CaretakerManager: ["attendance.manage"],
  Caretaker: ["attendance.read"],

  MensGroupManager: ["members.manage"],
  MensGroup: ["members.read"],

  WomensGroupManager: ["members.manage"],
  WomensGroup: ["members.read"],

  YouthGroupManager: ["members.manage"],
  YouthGroup: ["members.read"],

  GroupManager: ["members.manage"],
  Member: ["members.read"],
};

export function can(roles: Role[], permission: Permission): boolean {
  return roles.some(r => ROLE_PERMISSIONS[r]?.includes(permission));
}

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
  | "system.manage";

import type { Role } from "./roles";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  RootAdmin: ["system.manage", "roles.assign", "church.manage"],
  SystemAdmin: ["system.manage", "roles.assign"],
  RegionalAdmin: ["roles.assign"],
  Support: [],
  Auditor: [
    "members.read",
    "contributions.read",
    "events.read",
    "music.read",
    "servicePlans.read",
    "attendance.read",
  ],

  Admin: ["church.manage", "roles.assign"],

  Finance: ["contributions.read", "contributions.manage"],
  EventManager: ["events.read", "events.manage"],
  AttendanceManager: ["attendance.read", "attendance.manage"],
  MemberManager: ["members.read", "members.manage"],
  ServiceManager: ["servicePlans.read", "servicePlans.manage"],
  Pastor: ["members.read"],
  Minister: ["members.read"],
  Deacon: ["members.read"],

  MusicManager: ["music.read", "music.manage"],
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
  return roles.some(r => ROLE_PERMISSIONS[r]?.includes(permission));
}

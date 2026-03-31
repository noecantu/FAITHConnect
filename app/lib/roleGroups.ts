// src/lib/roleGroups.ts

import { MINISTRY_GROUPS, MinistryGroup } from "./ministryGroups";
import { Permission, PERMISSIONS } from "./permissions";

/**
 * Canonical roles in FAITH Connect.
 * These match exactly what is stored on the User document.
 */
export const ROLES = [
  // System-level
  "RootAdmin",
  "Admin",
  "Finance",
  "EventManager",
  "AttendanceManager",
  "MemberManager",
  "ServiceManager",

  // Pastoral / leadership
  "Pastor",
  "Minister",
  "Deacon",

  // Ministry groups (members + managers)
  "MusicManager",
  "MusicMember",
  "UsherManager",
  "Usher",
  "CaretakerManager",
  "Caretaker",
  "MensGroupManager",
  "MensGroup",
  "WomensGroupManager",
  "WomensGroup",
  "YouthGroupManager",
  "YouthGroup",

  // Generic fallback
  "GroupManager",

  // Basic member
  "Member",
] as const;

export type Role = (typeof ROLES)[number];

/**
 * Defines which ministry groups each role implicitly belongs to.
 */
export const ROLE_GROUP_MAP: Record<Role, MinistryGroup[]> = {
  RootAdmin: [...MINISTRY_GROUPS],
  Admin: [...MINISTRY_GROUPS],

  Finance: [],
  EventManager: [],
  AttendanceManager: [],
  MemberManager: [],
  ServiceManager: [],

  Pastor: [],
  Minister: [],
  Deacon: [],

  MusicManager: ["Music"],
  MusicMember: ["Music"],

  UsherManager: ["Usher"],
  Usher: ["Usher"],

  CaretakerManager: ["Caretaker"],
  Caretaker: ["Caretaker"],

  MensGroupManager: ["Men"],
  MensGroup: ["Men"],

  WomensGroupManager: ["Women"],
  WomensGroup: ["Women"],

  YouthGroupManager: ["Youth"],
  YouthGroup: ["Youth"],

  GroupManager: [], // dynamic fallback

  Member: [],
};

export function getGroupsForRole(role: Role): MinistryGroup[] {
  return ROLE_GROUP_MAP[role] ?? [];
}

export function getAllGroupsForRoles(roles: Role[]): MinistryGroup[] {
  const set = new Set<MinistryGroup>();

  for (const role of roles) {
    const groups = getGroupsForRole(role);
    groups.forEach(g => set.add(g));
  }

  return [...set];
}

export function isAdmin(roles: Role[]): boolean {
  return roles.includes("RootAdmin") || roles.includes("Admin");
}

export function isFinance(roles: Role[]): boolean {
  return roles.includes("Finance");
}

/**
 * Defines which permissions each role has.
 * This is the ONLY place where role→permission logic lives.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  RootAdmin: [...PERMISSIONS],
  Admin: [...PERMISSIONS],

  Finance: ["viewContributions", "editContributions"],

  EventManager: [
    "viewEvents",
    "createEvents",
    "editEvents",
    "deleteEvents",
    "viewServicePlans",
    "editServicePlans",
  ],

  AttendanceManager: ["viewAttendance", "editAttendance"],
  MemberManager: ["manageUsers"],
  ServiceManager: ["viewServicePlans", "editServicePlans"],

  Pastor: ["viewEvents", "viewServicePlans"],
  Minister: ["viewEvents"],
  Deacon: ["viewEvents"],

  MusicManager: ["viewServicePlans", "editServicePlans"],
  MusicMember: ["viewServicePlans"],

  UsherManager: ["viewEvents"],
  Usher: ["viewEvents"],

  CaretakerManager: ["viewEvents"],
  Caretaker: ["viewEvents"],

  MensGroupManager: ["viewEvents"],
  MensGroup: ["viewEvents"],

  WomensGroupManager: ["viewEvents"],
  WomensGroup: ["viewEvents"],

  YouthGroupManager: ["viewEvents"],
  YouthGroup: ["viewEvents"],

  GroupManager: ["viewEvents"],

  Member: ["viewEvents"],
};


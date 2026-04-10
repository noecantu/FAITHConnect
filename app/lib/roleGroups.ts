//app/lib/roleGroups.ts
export const SYSTEM_ROLES = [
  "RootAdmin",
  "SystemAdmin",
  "RegionalAdmin",
  "Support",
  "Auditor",
] as const;

export const CHURCH_ROLES = [
  "Admin",
  "Finance",
  "EventManager",
  "AttendanceManager",
  "MemberManager",
  "ServiceManager",
  "Pastor",
  "Minister",
  "Deacon",
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
  "GroupManager",
  "Member",
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];
export type ChurchRole = (typeof CHURCH_ROLES)[number];
export type Role = SystemRole | ChurchRole;

// -----------------------------
// ADMIN HELPERS
// -----------------------------
export function isAdmin(roles: Role[]) {
  return roles.includes("Admin");
}

export function isFinance(roles: Role[]) {
  return roles.includes("Finance");
}

// -----------------------------
// GROUP ROLE MAP
// -----------------------------
import type { MinistryGroup } from "./ministryGroups";

export const GROUP_ROLE_MAP: Record<Role, MinistryGroup[]> = {
  // System roles → no groups
  RootAdmin: [],
  SystemAdmin: [],
  RegionalAdmin: [],
  Support: [],
  Auditor: [],

  // Church roles
  Admin: [],
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

  GroupManager: [], // legacy
  Member: [],
};

// -----------------------------
// MAIN EXPORT — REQUIRED BY extractUserGroups.ts
// -----------------------------
export function getAllGroupsForRoles(roles: Role[]): MinistryGroup[] {
  const groups = new Set<MinistryGroup>();

  roles.forEach((role) => {
    const mapped = GROUP_ROLE_MAP[role];
    mapped.forEach((g) => groups.add(g));
  });

  return [...groups];
}
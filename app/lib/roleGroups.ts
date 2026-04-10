import { MinistryGroup } from "./ministryGroups";

//app/lib/roleGroups.ts
export const ROLES = [
  // System-level
  "RootAdmin",
  "SystemAdmin",
  "RegionalAdmin",
  "Support",
  "Auditor",

  // Church-level
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

// --- Role helpers used across the app ---

export function isAdmin(roles: Role[]) {
  return roles.includes("Admin");
}

export function isFinance(roles: Role[]) {
  return roles.includes("Finance");
}

export function getAllGroupsForRoles(roles: Role[]): MinistryGroup[] {
  const groups = new Set<MinistryGroup>();

  for (const role of roles) {
    const lower = role.toLowerCase();

    if (lower.startsWith("music")) groups.add("Music");
    if (lower.startsWith("usher")) groups.add("Usher");
    if (lower.startsWith("caretaker")) groups.add("Caretaker");
    if (lower.startsWith("mensgroup")) groups.add("Men");
    if (lower.startsWith("womensgroup")) groups.add("Women");
    if (lower.startsWith("youthgroup")) groups.add("Youth");
  }

  return [...groups];
}
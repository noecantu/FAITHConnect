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

export function isAdmin(roles: Role[]) {
  return roles.includes("Admin");
}

export function isFinance(roles: Role[]) {
  return roles.includes("Finance");
}

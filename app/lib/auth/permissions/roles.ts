// -----------------------------
// SYSTEM ROLES
// -----------------------------
export const SYSTEM_ROLES = [
  "RootAdmin",
  "SystemAdmin",
  "RegionalAdmin",
  "Support",
  "Auditor",
] as const;

// -----------------------------
// CHURCH ROLES
// -----------------------------
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

// -----------------------------
// ROLE TYPES
// -----------------------------
export type SystemRole = (typeof SYSTEM_ROLES)[number];
export type ChurchRole = (typeof CHURCH_ROLES)[number];
export type Role = SystemRole | ChurchRole;

// -----------------------------
// ALL ROLES (for UI lists)
// -----------------------------
export const ALL_ROLES: Role[] = [
  ...(SYSTEM_ROLES as unknown as Role[]),
  ...(CHURCH_ROLES as unknown as Role[]),
];

// -----------------------------
// ROLE LABEL MAP
// -----------------------------
export const ROLE_MAP: Record<Role, string> = {
  RootAdmin: "Root Admin",
  SystemAdmin: "System Admin",
  RegionalAdmin: "Regional Admin",
  Support: "Support",
  Auditor: "Auditor",

  Admin: "Church Admin",
  Finance: "Finance",
  EventManager: "Event Manager",
  AttendanceManager: "Attendance Manager",
  MemberManager: "Member Manager",
  ServiceManager: "Service Manager",
  Pastor: "Pastor",
  Minister: "Minister",
  Deacon: "Deacon",

  MusicManager: "Music Manager",
  MusicMember: "Music Member",

  UsherManager: "Usher Manager",
  Usher: "Usher",

  CaretakerManager: "Caretaker Manager",
  Caretaker: "Caretaker",

  MensGroupManager: "Men's Group Manager",
  MensGroup: "Men's Group",

  WomensGroupManager: "Women's Group Manager",
  WomensGroup: "Women's Group",

  YouthGroupManager: "Youth Group Manager",
  YouthGroup: "Youth Group",

  GroupManager: "Group Manager",
  Member: "Member",
};

// -----------------------------
// SIMPLE HELPERS
// -----------------------------
export function isAdmin(roles: Role[]) {
  return roles.includes("Admin");
}

export function isFinance(roles: Role[]) {
  return roles.includes("Finance");
}

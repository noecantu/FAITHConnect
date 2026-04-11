// SYSTEM ROLES — literal tuple
export const SYSTEM_ROLES = [
  "RootAdmin",
  "SystemAdmin",
  "RegionalAdmin",
  "Support",
  "Auditor",
] as const;

// CHURCH ROLES — literal tuple
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

// Combined tuple
export const ROLES = [...SYSTEM_ROLES, ...CHURCH_ROLES] as const;

// Role type
export type Role = (typeof ROLES)[number];

// SystemRole type
export type SystemRole = typeof SYSTEM_ROLES[number];

// ALL_ROLES (must come AFTER Role exists)
export const ALL_ROLES: Role[] = [...ROLES];

// SYSTEM_ROLE_LIST (must come AFTER Role exists)
export const SYSTEM_ROLE_LIST: Role[] = [...SYSTEM_ROLES];

// Labels
export const ROLE_LABELS: Record<Role, string> = {
  RootAdmin: "Root Administrator",
  SystemAdmin: "System Administrator",
  RegionalAdmin: "Regional Administrator",
  Support: "Support Staff",
  Auditor: "Auditor",

  Admin: "Church Administrator",
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

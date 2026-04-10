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

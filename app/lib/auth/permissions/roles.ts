export const ROLE_MAP = {
  RootAdmin: "Root Administrator",
  SystemAdmin: "System Administrator",
  RegionalAdmin: "Regional Administrator",
  Support: "Support Staff",
  Auditor: "Auditor (Read-Only)", 
  Admin: "Administrator",
  AttendanceManager: "Attendance Manager",
  Caretaker: "Caretaker",
  CaretakerManager: "Caretaker Manager",
  Deacon: "Deacon",
  EventManager: "Event Manager",
  Finance: "Finance Manager",
  MemberManager: "Member Manager",
  MensGroup: "Men's Group",
  MensGroupManager: "Men's Group Manager",
  Minister: "Minister",
  MusicManager: "Music Manager",
  MusicMember: "Music Member",
  Pastor: "Pastor",
  ServiceManager: "Service Manager",
  Usher: "Usher",
  UsherManager: "Usher Manager",
  WomensGroup: "Women's Group",
  WomensGroupManager: "Women's Group Manager",
  YouthGroup: "Youth Group",
  YouthGroupManager: "Youth Group Manager"
} as const;

export type Role = keyof typeof ROLE_MAP;

export const ALL_ROLES: Role[] = Object.keys(ROLE_MAP) as Role[];

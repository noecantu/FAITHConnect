export const ROLE_MAP = {
    RootAdmin: "Root Administrator",
    Admin: "Administrator",
    AttendanceManager: "Attendance Manager",
    EventManager: "Event Manager",
    Finance: "Finance Manager",
    MemberManager: "Member Manager",
    MusicManager: "Music Manager",
    MusicMember: "Music Member",
    Pastor: "Pastor",
    ServiceManager: "Service Manager",
  } as const;
  
  export type Role = keyof typeof ROLE_MAP;
  
  export const ALL_ROLES: Role[] = Object.keys(ROLE_MAP) as Role[];
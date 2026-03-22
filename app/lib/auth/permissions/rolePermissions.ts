import type { Permission } from "./permissions";
import type { Role } from "./roles";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  RootAdmin: [
    "system.manage",
    "churches.manage",
    "admins.manage",

    "church.manage",
    "members.read",
    "members.manage",
    "roles.assign",
    "attendance.read",
    "attendance.manage",
    "events.read",
    "events.manage",
    "finance.read",
    "finance.manage",
    "servicePlans.read",
    "servicePlans.manage",

    "music.read",
    "music.manage",
    "usher.read",
    "usher.manage",
    "caretaker.read",
    "caretaker.manage",
    "men.read",
    "men.manage",
    "women.read",
    "women.manage",
    "youth.read",
    "youth.manage"
  ],

  Admin: [
    "church.manage",
    "members.read",
    "members.manage",
    "roles.assign",
    "attendance.read",
    "attendance.manage",
    "events.read",
    "events.manage",
    "finance.read",
    "finance.manage",
    "servicePlans.read",
    "servicePlans.manage",

    "music.read",
    "music.manage",
    "usher.read",
    "usher.manage",
    "caretaker.read",
    "caretaker.manage",
    "men.read",
    "men.manage",
    "women.read",
    "women.manage",
    "youth.read",
    "youth.manage"
  ],

  AttendanceManager: ["attendance.read", "attendance.manage"],
  EventManager: ["events.read", "events.manage"],
  Finance: ["finance.read", "finance.manage"],
  MemberManager: ["members.read", "members.manage", "roles.assign"],
  ServiceManager: ["servicePlans.read", "servicePlans.manage"],

  Pastor: ["members.read", "events.read", "attendance.read", "servicePlans.read"],
  Minister: ["members.read", "events.read", "servicePlans.read"],
  Deacon: ["members.read", "events.read"],

  MusicManager: ["music.read", "music.manage"],
  MusicMember: ["music.read"],

  UsherManager: ["usher.read", "usher.manage"],
  Usher: ["usher.read"],

  CaretakerManager: ["caretaker.read", "caretaker.manage"],
  Caretaker: ["caretaker.read"],

  MensGroupManager: ["men.read", "men.manage"],
  MensGroup: ["men.read"],

  WomensGroupManager: ["women.read", "women.manage"],
  WomensGroup: ["women.read"],

  YouthGroupManager: ["youth.read", "youth.manage"],
  YouthGroup: ["youth.read"]
} as const;

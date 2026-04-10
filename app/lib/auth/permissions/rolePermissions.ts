import { Permission } from "./permissions";
import { Role } from "./roles";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // ─────────────────────────────────────────────
  // SYSTEM-LEVEL ROLES
  // ─────────────────────────────────────────────
  RootAdmin: [
    "auth.login",
    "system.manage",
    "churches.manage",
    "admins.manage",

    "church.manage",
    "members.read",
    "members.manage",
    "roles.assign",
    "attendance.read",
    "attendance.manage",
    "contributions.read",
    "contributions.manage",
    "events.read",
    "events.manage",
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

  SystemAdmin: [
    "auth.login",
    "system.manage",
    "churches.manage",
    "admins.manage",

    "members.read",
    "attendance.read",
    "contributions.read",
    "events.read",
    "servicePlans.read"
  ],

  RegionalAdmin: [
    "auth.login",

    // Regional-level management
    "churches.manage",
    "members.read",
    "members.manage",
    "attendance.read",
    "attendance.manage",
    "contributions.read",
    "contributions.manage",
    "events.read",
    "events.manage",
    "servicePlans.read",
    "servicePlans.manage",

    // Ministry groups
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

  Support: [
    "auth.login",
    "members.read",
    "attendance.read",
    "contributions.read",
    "events.read",
    "servicePlans.read"
  ],

  Auditor: [
    "auth.login",
    "members.read",
    "attendance.read",
    "contributions.read",
    "events.read",
    "servicePlans.read"
  ],

  // ─────────────────────────────────────────────
  // CHURCH-LEVEL ROLES
  // ─────────────────────────────────────────────
  Admin: [
    "auth.login",
    "church.manage",
    "members.read",
    "members.manage",
    "roles.assign",
    "attendance.read",
    "attendance.manage",
    "contributions.read",
    "contributions.manage",
    "events.read",
    "events.manage",
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

  AttendanceManager: ["auth.login", "attendance.read", "attendance.manage"],
  EventManager: ["auth.login", "events.read", "events.manage"],
  Finance: ["auth.login", "contributions.read", "contributions.manage"],
  MemberManager: ["auth.login", "members.read", "members.manage", "roles.assign"],
  ServiceManager: ["auth.login", "servicePlans.read", "servicePlans.manage"],

  // ─────────────────────────────────────────────
  // PASTORAL / LEADERSHIP
  // ─────────────────────────────────────────────
  Pastor: ["auth.login", "members.read", "events.read", "attendance.read", "servicePlans.read"],
  Minister: ["auth.login", "members.read", "events.read", "servicePlans.read"],
  Deacon: ["auth.login", "members.read", "events.read"],

  // ─────────────────────────────────────────────
  // MINISTRY GROUPS
  // ─────────────────────────────────────────────
  MusicManager: ["auth.login", "music.read", "music.manage"],
  MusicMember: ["auth.login", "music.read"],

  UsherManager: ["auth.login", "usher.read", "usher.manage"],
  Usher: ["auth.login", "usher.read"],

  CaretakerManager: ["auth.login", "caretaker.read", "caretaker.manage"],
  Caretaker: ["auth.login", "caretaker.read"],

  MensGroupManager: ["auth.login", "men.read", "men.manage"],
  MensGroup: ["auth.login", "men.read"],

  WomensGroupManager: ["auth.login", "women.read", "women.manage"],
  WomensGroup: ["auth.login", "women.read"],

  YouthGroupManager: ["auth.login", "youth.read", "youth.manage"],
  YouthGroup: ["auth.login", "youth.read"]
} as const;

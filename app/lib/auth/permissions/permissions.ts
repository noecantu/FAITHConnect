export const PERMISSIONS = {
  // Church-Level
  "church.manage": "Manage church settings",
  "members.read": "View members",
  "members.manage": "Create, update, delete members",
  "roles.assign": "Assign roles to members",
  "attendance.read": "View attendance",
  "attendance.manage": "Record and edit attendance",
  "events.read": "View events and calendar",
  "events.manage": "Create and edit events",
  "finance.read": "View contributions and reports",
  "finance.manage": "Manage contributions and financial settings",

  // Ministry-Level
  "servicePlans.read": "View service plans",
  "servicePlans.manage": "Create and edit service plans",

  "music.read": "View music ministry items",
  "music.manage": "Manage music ministry",

  "usher.read": "View usher ministry items",
  "usher.manage": "Manage usher ministry",

  "caretaker.read": "View caretaker ministry items",
  "caretaker.manage": "Manage caretaker ministry",

  "men.read": "View men's ministry items",
  "men.manage": "Manage men's ministry",

  "women.read": "View women's ministry items",
  "women.manage": "Manage women's ministry",

  "youth.read": "View youth ministry items",
  "youth.manage": "Manage youth ministry",

  // System-Level
  "system.manage": "Manage system settings",
  "churches.manage": "Create and manage churches",
  "admins.manage": "Create and manage system-level admins"
} as const;

export type Permission = keyof typeof PERMISSIONS;

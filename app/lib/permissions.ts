// src/lib/permissions.ts

/**
 * Canonical permissions in FAITH Connect.
 * These are the atomic capabilities of the system.
 */
export const PERMISSIONS = [
  "viewEvents",
  "createEvents",
  "editEvents",
  "deleteEvents",

  "viewServicePlans",
  "createServicePlans",
  "editServicePlans",
  "deleteServicePlans",

  "viewAttendance",
  "editAttendance",

  "viewContributions",
  "editContributions",

  "manageUsers",
  "manageRoles",
  "manageChurchSettings",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

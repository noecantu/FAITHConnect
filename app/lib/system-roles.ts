// app/lib/system-roles.ts

export type SystemRole =
  | "RootAdmin"
  | "SystemAdmin"
  | "Support"
  | "Auditor";

// Export the list of system roles
export const SYSTEM_ROLES: SystemRole[] = [
  "RootAdmin",
  "SystemAdmin",
  "Support",
  "Auditor",
];

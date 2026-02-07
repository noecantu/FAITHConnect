import { SystemRole } from "./system-roles";

export const SYSTEM_ROLE_MAP: Record<SystemRole, string> = {
  RootAdmin: "Root Administrator",
  SystemAdmin: "System Administrator",
  Support: "Support Staff",
  Auditor: "Auditor (Read-Only)",
};

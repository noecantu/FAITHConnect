//app/lib/system-role-mao.ts
import { SystemRole } from "./system-roles";

export const SYSTEM_ROLE_MAP: Record<SystemRole, string> = {
  RootAdmin: "Root Administrator",
  SystemAdmin: "System Administrator",
  RegionalAdmin: "Regional Administrator",
  Support: "Support Staff",
  Auditor: "Auditor (Read-Only)",
};

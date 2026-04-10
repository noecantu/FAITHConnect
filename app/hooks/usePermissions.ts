import { Role } from "../lib/auth/permissions/roles";
import { useAuth } from "./useAuth";

export function usePermissions() {
  const { user } = useAuth();
  const roles = user?.roles ?? [];

const hasRole = (role: Role) => roles.includes(role);
  return {
    user,

    // System-level roles
    isRootAdmin: hasRole("RootAdmin"),
    isSystemAdmin: hasRole("SystemAdmin"),
    isRegionalAdmin: hasRole("RegionalAdmin"),
    isSupport: hasRole("Support"),
    isAuditor: hasRole("Auditor"),

    // Church-level
    isAdmin: hasRole("Admin"),

    // Context
    regionId: user?.regionId ?? null,
    churchId: user?.churchId ?? null
  };
}

import { Permission, ROLE_PERMISSIONS } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";

export function canUser(roles: Role[], permission: Permission): boolean {
  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role] ?? [];
    if (perms.includes(permission)) return true;
  }
  return false;
}

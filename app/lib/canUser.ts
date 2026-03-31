import { ROLE_PERMISSIONS } from "./roleGroups";
import type { Role } from "./roleGroups";
import type { Permission } from "./permissions";

export function canUser(roles: Role[], permission: Permission): boolean {
  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role] ?? [];
    if (perms.includes(permission)) return true;
  }
  return false;
}

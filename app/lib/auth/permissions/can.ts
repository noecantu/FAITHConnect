import type { Permission } from "./permissions";
import { ROLE_PERMISSIONS } from "./rolePermissions";
import type { Role } from "./roles";

export function can(roles: Role[], permission: Permission): boolean {
  for (const role of roles) {
    if (ROLE_PERMISSIONS[role]?.includes(permission)) {
      return true;
    }
  }
  return false;
}

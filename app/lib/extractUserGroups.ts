import { normalizeGroupName, MinistryGroup } from "./ministryGroups";
import { getAllGroupsForRoles, isAdmin, Role } from "./roleGroups";

export interface UserLike {
  roles: Role[];
  group?: string | null; // legacy fallback
}

/**
 * Returns the full list of ministry groups a user belongs to.
 * This includes:
 * - Groups implied by their roles (MusicManager → Music)
 * - Their assigned group (legacy GroupManager fallback)
 * - All groups (if Admin)
 */
export function extractUserGroups(user: UserLike): MinistryGroup[] {
  const { roles } = user;

  // 1. Admins automatically belong to ALL groups
  if (isAdmin(roles)) {
    return getAllGroupsForRoles(["Admin"]); // Admin already maps to all groups
  }

  const groups = new Set<MinistryGroup>();

  // 2. Add groups implied by roles (MusicManager → ["Music"], etc.)
  const roleGroups = getAllGroupsForRoles(roles);
  roleGroups.forEach(g => groups.add(g));

  // 3. Legacy fallback: If generic GroupManager, use user.group
  if (roles.includes("GroupManager") && user.group) {
    const normalized = normalizeGroupName(user.group);
    if (normalized) groups.add(normalized);
  }

  return [...groups];
}

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

  if (isAdmin(roles)) {
    return getAllGroupsForRoles(["Admin"]);
  }

  const groups = new Set<MinistryGroup>();

  // 2. Add groups implied by roles
  const roleGroups = getAllGroupsForRoles(roles);
  roleGroups.forEach(g => groups.add(g));

  // 2b. Ensure ministry managers get their primary group
  const managerGroup = roles
    .map(r => normalizeGroupName(r))
    .filter(Boolean)[0];

  if (managerGroup) {
    groups.add(managerGroup as MinistryGroup);
  }

  // 3. Legacy fallback
  if (roles.includes("GroupManager") && user.group) {
    const normalized = normalizeGroupName(user.group);
    if (normalized) groups.add(normalized);
  }

  return [...groups];
}

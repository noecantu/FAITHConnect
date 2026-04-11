// app/lib/canUserSeeEvent.ts

import { getGroupsForRoles, normalizeGroupName, type MinistryGroup } from "@/app/lib/auth/groups";
import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";

export interface UserLike {
  roles: Role[];
}

export interface EventLike {
  visibility: "public" | "private";
  groups?: string[] | null;
}

export function canUserSeeEvent(
  user: UserLike,
  event: EventLike
): boolean {
  const roles = user.roles;

  // ⭐ System-level roles see everything
  if (
    roles.includes("RootAdmin") ||
    roles.includes("SystemAdmin") ||
    roles.includes("RegionalAdmin") ||
    roles.includes("Support") ||
    roles.includes("Auditor")
  ) {
    return true;
  }

  // ⭐ Event Managers see everything
  if (roles.includes("EventManager")) return true;

  // ⭐ Admins see everything
  if (can(roles, "church.manage")) return true;

  // ⭐ Public events are visible to everyone
  if (event.visibility === "public") return true;

  // ⭐ Private events require group intersection
  const userGroups = getGroupsForRoles(roles);

  const eventGroups = (event.groups || [])
    .map(g => normalizeGroupName(g))
    .filter((g): g is MinistryGroup => Boolean(g));

  // ⭐ Group members can see their group's private events
  if (eventGroups.some(g => userGroups.includes(g))) {
    return true;
  }

  // ⭐ Group Managers can see private events for their group
  const managerGroups = roles
    .filter(r => r.endsWith("GroupManager"))
    .map(r => normalizeGroupName(r.replace("Manager", "")))
    .filter((g): g is MinistryGroup => Boolean(g));

  if (eventGroups.some(g => managerGroups.includes(g))) {
    return true;
  }

  // ⭐ Finance sees ONLY public events — but we check this LAST
  if (roles.includes("Finance")) {
    return false;
  }

  return false;
}

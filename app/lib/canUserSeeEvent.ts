//app/lib/canUserSeeEvent.ts
import { extractUserGroups, type UserLike } from "./extractUserGroups";
import { isAdmin, isFinance } from "./roleGroups";
import { normalizeGroupName, type MinistryGroup } from "./ministryGroups";

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
  if (isAdmin(roles)) return true;

  // ⭐ Public events are visible to everyone
  if (event.visibility === "public") return true;

  // ⭐ Private events require group intersection
  const userGroups = extractUserGroups(user);

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
  if (isFinance(roles)) {
    return false;
  }

  return false;
}

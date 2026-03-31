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

  // 1. Admins see everything
  if (isAdmin(roles)) return true;

  // 2. Finance sees ONLY public events
  if (isFinance(roles)) {
    return event.visibility === "public";
  }

  // 3. Public events are visible to everyone else
  if (event.visibility === "public") return true;

  // 4. Private events require group intersection
  const userGroups = extractUserGroups(user);

  const eventGroups = (event.groups || [])
    .map(g => normalizeGroupName(g))
    .filter((g): g is MinistryGroup => Boolean(g));

  return eventGroups.some(g => userGroups.includes(g));
}

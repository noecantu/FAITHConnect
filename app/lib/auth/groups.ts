// app/lib/auth/groups.ts
// New with redundancy Removal

export const MINISTRY_GROUPS = [
  "Music",
  "Usher",
  "Caretaker",
  "Men",
  "Women",
  "Youth",
] as const;

export type MinistryGroup = (typeof MINISTRY_GROUPS)[number];

export const GROUP_LABELS: Record<MinistryGroup, string> = {
  Music: "Music Ministry",
  Usher: "Ushers",
  Caretaker: "Caretakers",
  Men: "Men's Group",
  Women: "Women's Group",
  Youth: "Youth Group",
};

export function normalizeGroupName(value: string): MinistryGroup | null {
  const v = value.trim().toLowerCase();

  if (v.startsWith("music")) return "Music";
  if (v.startsWith("usher")) return "Usher";
  if (v.startsWith("caretaker")) return "Caretaker";
  if (v.startsWith("men")) return "Men";
  if (v.startsWith("women")) return "Women";
  if (v.startsWith("youth")) return "Youth";

  return null;
}

// Role → group mapping
import type { Role } from "./roles";

export const ROLE_GROUP_MAP: Record<Role, MinistryGroup[]> = {
  RootAdmin: [],
  SystemAdmin: [],
  DistrictAdmin: [],
  RegionalAdmin: [],
  Support: [],
  Auditor: [],

  Admin: [],
  Finance: [],
  EventManager: [],
  AttendanceManager: [],
  MemberManager: [],
  ServiceManager: [],
  Pastor: [],
  Minister: [],
  Deacon: [],

  MusicManager: ["Music"],
  MusicMember: ["Music"],

  UsherManager: ["Usher"],
  Usher: ["Usher"],

  CaretakerManager: ["Caretaker"],
  Caretaker: ["Caretaker"],

  MensGroupManager: ["Men"],
  MensGroup: ["Men"],

  WomensGroupManager: ["Women"],
  WomensGroup: ["Women"],

  YouthGroupManager: ["Youth"],
  YouthGroup: ["Youth"],

  GroupManager: [],
  Member: [],
};

export function getGroupsForRoles(roles: Role[]): MinistryGroup[] {
  const set = new Set<MinistryGroup>();
  roles.forEach(r => ROLE_GROUP_MAP[r].forEach(g => set.add(g)));
  return [...set];
}

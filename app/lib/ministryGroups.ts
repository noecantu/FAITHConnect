// src/lib/ministryGroups.ts

export const MINISTRY_GROUPS = [
  "Music",
  "Usher",
  "Caretaker",
  "Men",
  "Women",
  "Youth",
] as const;

export type MinistryGroup = (typeof MINISTRY_GROUPS)[number];

export function isValidMinistryGroup(value: string): value is MinistryGroup {
  return MINISTRY_GROUPS.includes(value as MinistryGroup);
}

export function normalizeGroupName(value: string): MinistryGroup | null {
  const cleaned = value.trim().toLowerCase();

  for (const group of MINISTRY_GROUPS) {
    if (group.toLowerCase() === cleaned) {
      return group;
    }
  }

  return null;
}

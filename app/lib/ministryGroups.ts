// src/lib/ministryGroups.ts

export const MINISTRY_GROUPS = [
  "Music2",
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

  // Handle common variants
  if (cleaned.startsWith("women")) return "Women";
  if (cleaned.startsWith("men")) return "Men";
  if (cleaned.startsWith("music")) return "Music2";
  if (cleaned.startsWith("usher")) return "Usher";
  if (cleaned.startsWith("caretaker")) return "Caretaker";
  if (cleaned.startsWith("youth")) return "Youth";

  return null;
}

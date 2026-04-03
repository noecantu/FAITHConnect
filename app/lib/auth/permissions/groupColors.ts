export const GROUP_COLOR_MAP: Record<string, string> = {
  music: "rgba(144, 238, 144, 0.20)",
  youth: "rgba(50, 205, 50, 0.20)",
  women: "rgba(255, 20, 147, 0.20)",
  men: "rgba(30, 144, 255, 0.20)",
  finance: "rgba(138, 43, 226, 0.20)",
  admin: "rgba(178, 34, 34, 0.20)",
  service: "rgba(128, 0, 0, 0.20)",
  usher: "rgba(255, 215, 0, 0.20)",
  caretaker: "rgba(34, 139, 34, 0.20)",
  servicePlan: "rgba(255, 0, 0, 0.30)",
};

export function getGroupColor(groups: string[]): string {
  if (!groups || groups.length === 0) return "rgba(255, 0, 0, 0.30)";

  const group = groups[0].toLowerCase();
  return GROUP_COLOR_MAP[group] ?? "rgba(255, 0, 0, 0.30)";
}

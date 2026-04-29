export const GROUP_COLOR_MAP: Record<string, string> = {
  music: "rgba(255, 165, 0, 00.50)",        //Orange
  youth: "rgba(50, 205, 50, 00.50)",        //Lime green
  women: "rgba(255, 20, 147, 00.50)",       //Deep pink
  men: "rgba(30, 144, 255, 00.50)",         //Dodger blue
  finance: "rgba(138, 43, 226, 00.50)",     //Blue violet
  admin: "rgba(178, 34, 34, 00.50)",        //Fire brick
  service: "rgba(255, 99, 71, 00.50)",      //Tomato
  usher: "rgba(255, 255, 0, 00.50)",        //Gold
  caretaker: "rgba(34, 139, 34, 00.50)",    //Forest green
  servicePlan: "rgba(255, 99, 71, 00.50)",  //Tomato
};

export function getGroupColor(groups: string[]): string {
  if (!groups || groups.length === 0) return "rgba(255, 99, 71, 00.50)";

  const group = groups[0].toLowerCase();
  return GROUP_COLOR_MAP[group] ?? "rgba(255, 99, 71, 00.50)";
}

/**
 * Returns the display color for a calendar item.
 * Uses group color when groups are assigned; falls back to
 * violet for service plans and sky for events.
 */
export function getCalendarItemColor(groups: string[], isService: boolean): string {
  if (groups && groups.length > 0) return getGroupColor(groups);
  return isService ? "rgba(139, 92, 246, 0.6)" : "rgba(14, 165, 233, 0.6)";
}

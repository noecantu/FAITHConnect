export const GROUP_COLOR_MAP: Record<string, string> = {
  music: "rgba(255, 165, 0, 0.20)",        //Orange
  youth: "rgba(50, 205, 50, 0.20)",        //Lime green
  women: "rgba(255, 20, 147, 0.20)",       //Deep pink
  men: "rgba(30, 144, 255, 0.20)",         //Dodger blue
  finance: "rgba(138, 43, 226, 0.20)",     //Blue violet
  admin: "rgba(178, 34, 34, 0.20)",        //Fire brick
  service: "rgba(255, 99, 71, 0.30)",      //Tomato
  usher: "rgba(255, 255, 0, 0.20)",        //Gold
  caretaker: "rgba(34, 139, 34, 0.20)",    //Forest green
  servicePlan: "rgba(255, 99, 71, 0.30)",  //Tomato
};

export function getGroupColor(groups: string[]): string {
  if (!groups || groups.length === 0) return "rgba(255, 99, 71, 0.30)";

  const group = groups[0].toLowerCase();
  return GROUP_COLOR_MAP[group] ?? "rgba(255, 99, 71, 0.30)";
}

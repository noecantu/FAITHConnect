// app/lib/sectionColors.ts

function normalizeSectionTitle(str: string) {
  return str.replace(/\s+/g, "").toLowerCase();
}

const SECTION_COLORS: Record<string, string> = {
  opening: "rgba(139, 92, 246, 00.15)",     // purple
  praise: "rgba(59, 115, 246, 00.15)",      // blue
  worship: "rgba(251, 146, 60, 00.15)",     // orange
  offering: "rgba(239, 68, 68, 00.15)",     // red
  altarcall: "rgba(34, 197, 94, 00.15)",    // green
  specialsong: "rgba(234, 179, 8, 00.15)",  // yellow
};

export function getSectionColor(title: string): string {
  const key = normalizeSectionTitle(title);
  return SECTION_COLORS[key] ?? "transparent";
}

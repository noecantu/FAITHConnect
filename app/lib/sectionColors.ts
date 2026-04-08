// app/lib/sectionColors.ts

function normalizeSectionTitle(str: string) {
  return str.replace(/\s+/g, "").toLowerCase();
}

const SECTION_COLORS: Record<string, string> = {
  opening: "rgba(139, 92, 246, 00.50)",     // purple
  praise: "rgba(59, 130, 246, 00.50)",      // blue
  worship: "rgba(251, 146, 60, 00.50)",     // orange
  offering: "rgba(239, 68, 68, 00.50)",     // red
  altarcall: "rgba(34, 197, 94, 00.50)",    // green
  specialsong: "rgba(234, 179, 8, 00.50)",  // yellow
};

export function getSectionColor(title: string): string {
  const key = normalizeSectionTitle(title);
  return SECTION_COLORS[key] ?? "transparent";
}

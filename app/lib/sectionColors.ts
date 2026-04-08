// app/lib/sectionColors.ts

function normalizeSectionTitle(str: string) {
  return str.replace(/\s+/g, "").toLowerCase();
}

const SECTION_COLORS: Record<string, string> = {
  opening: "rgba(139, 92, 246, 0.40)",     // purple
  praise: "rgba(59, 130, 246, 0.40)",      // blue
  worship: "rgba(251, 146, 60, 0.40)",     // orange
  offering: "rgba(239, 68, 68, 0.40)",     // red
  altarcall: "rgba(34, 197, 94, 0.40)",    // green
  specialsong: "rgba(234, 179, 8, 0.40)",  // yellow
};

export function getSectionColor(title: string): string {
  const key = normalizeSectionTitle(title);
  return SECTION_COLORS[key] ?? "transparent";
}

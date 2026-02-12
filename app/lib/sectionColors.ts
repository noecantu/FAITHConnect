// app/lib/sectionColors.ts

export const normalizeSectionTitle = (str: string) =>
  str.replace(/\s+/g, "").toLowerCase();

export const SECTION_COLORS: Record<string, string> = {
  opening: "rgba(139, 92, 246, 0.10)",     // purple
  praise: "rgba(59, 130, 246, 0.10)",      // blue
  worship: "rgba(251, 146, 60, 0.10)",     // orange
  offering: "rgba(239, 68, 68, 0.10)",     // red
  altarcall: "rgba(34, 197, 94, 0.10)",    // green
  specialsong: "rgba(234, 179, 8, 0.10)",  // yellow
};

// Safe accessor
export function getSectionColor(title: string): string {
  const key = normalizeSectionTitle(title);
  return SECTION_COLORS[key] ?? "transparent";
}

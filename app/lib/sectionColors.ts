// app/lib/sectionColors.ts

function normalizeSectionTitle(str: string) {
  return str.replace(/\s+/g, "").toLowerCase();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const SECTION_COLORS: Record<string, string> = {
  opening:     "rgba(139, 92,  246, 0.20)",  // purple
  praise:      "rgba(59,  130, 246, 0.20)",  // blue
  worship:     "rgba(251, 146, 60,  0.20)",  // orange
  offering:    "rgba(239, 68,  68,  0.20)",  // red
  altarcall:   "rgba(34,  197, 94,  0.20)",  // green
  specialsong: "rgba(234, 179, 8,   0.20)",  // yellow
};

/** Returns the default color for a section based on its title. */
export function getSectionColor(title: string): string {
  const key = normalizeSectionTitle(title);
  if (!key) return "transparent";

  // Preserve semantic colors for well-known section names.
  if (SECTION_COLORS[key]) {
    return SECTION_COLORS[key];
  }

  // Deterministic fallback for custom/new section names.
  const idx = hashString(key) % SECTION_COLOR_PALETTE.length;
  return SECTION_COLOR_PALETTE[idx].bg;
}

/** Palette exposed to the color picker UI. */
export const SECTION_COLOR_PALETTE: { label: string; bg: string; solid: string }[] = [
  { label: "Purple",  bg: "rgba(139, 92,  246, 0.25)", solid: "#8b5cf6" },
  { label: "Blue",    bg: "rgba(59,  130, 246, 0.25)", solid: "#3b82f6" },
  { label: "Cyan",    bg: "rgba(6,   182, 212, 0.25)", solid: "#06b6d4" },
  { label: "Teal",    bg: "rgba(20,  184, 166, 0.25)", solid: "#14b8a6" },
  { label: "Green",   bg: "rgba(34,  197, 94,  0.25)", solid: "#22c55e" },
  { label: "Yellow",  bg: "rgba(234, 179, 8,   0.25)", solid: "#eab308" },
  { label: "Orange",  bg: "rgba(251, 146, 60,  0.25)", solid: "#f97316" },
  { label: "Red",     bg: "rgba(239, 68,  68,  0.25)", solid: "#ef4444" },
  { label: "Pink",    bg: "rgba(236, 72,  153, 0.25)", solid: "#ec4899" },
  { label: "Indigo",  bg: "rgba(99,  102, 241, 0.25)", solid: "#6366f1" },
];

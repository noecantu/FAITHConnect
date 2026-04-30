type RawTranslation = {
  identifier?: unknown;
  id?: unknown;
  translation_id?: unknown;
  name?: unknown;
  language?: unknown;
};

export type ScriptureTranslationOption = {
  id: string;
  name: string;
  language: string;
};

const TRANSLATION_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

let translationCache: {
  data: ScriptureTranslationOption[];
  fetchedAt: number;
} | null = null;

function normalizeTranslation(raw: RawTranslation): ScriptureTranslationOption | null {
  const idCandidate =
    typeof raw.identifier === "string"
      ? raw.identifier
      : typeof raw.id === "string"
      ? raw.id
      : typeof raw.translation_id === "string"
      ? raw.translation_id
      : "";

  const id = idCandidate.trim().toLowerCase();
  if (!id) return null;

  const name = typeof raw.name === "string" && raw.name.trim().length > 0
    ? raw.name.trim()
    : id.toUpperCase();

  const language = typeof raw.language === "string" && raw.language.trim().length > 0
    ? raw.language.trim()
    : "Unknown";

  return { id, name, language };
}

function parseTranslationList(payload: unknown): ScriptureTranslationOption[] {
  const container = payload as { translations?: unknown } | null;
  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray(container?.translations)
    ? container.translations
    : [];

  const parsed = rawList
    .map((item) => normalizeTranslation((item ?? {}) as RawTranslation))
    .filter((item): item is ScriptureTranslationOption => Boolean(item));

  const unique = new Map<string, ScriptureTranslationOption>();
  for (const item of parsed) {
    unique.set(item.id, item);
  }

  return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAvailableScriptureTranslations(forceRefresh = false): Promise<ScriptureTranslationOption[]> {
  const now = Date.now();
  if (!forceRefresh && translationCache && now - translationCache.fetchedAt < TRANSLATION_CACHE_TTL_MS) {
    return translationCache.data;
  }

  const response = await fetch("https://bible-api.com/data", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch translations (${response.status})`);
  }

  const payload = await response.json().catch(() => null);
  const data = parseTranslationList(payload);

  if (data.length === 0) {
    throw new Error("No translations returned by bible-api.com");
  }

  translationCache = {
    data,
    fetchedAt: now,
  };

  return data;
}

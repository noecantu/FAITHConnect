export type ScriptureLookupResult = {
  reference: string;
  verseText: string;
  translation: string;
  source: "live" | "cache";
};

export type ScriptureTranslationOption = {
  id: string;
  name: string;
  language: string;
};

export async function getScriptureTranslations(): Promise<ScriptureTranslationOption[]> {
  const res = await fetch("/api/scripture/translations", {
    method: "GET",
    credentials: "include",
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      typeof body?.error === "string"
        ? body.error
        : `Failed to load translations (${res.status})`
    );
  }

  const list = Array.isArray(body?.translations) ? body.translations : [];

  return list
    .map((item) => ({
      id: String(item?.id ?? "").trim().toLowerCase(),
      name: String(item?.name ?? "").trim(),
      language: String(item?.language ?? "").trim(),
    }))
    .filter((item) => item.id.length > 0);
}

export async function lookupScripture(reference: string, translation?: string): Promise<ScriptureLookupResult> {
  const res = await fetch("/api/scripture/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      reference,
      translation,
    }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      typeof body?.error === "string"
        ? body.error
        : `Scripture lookup failed (${res.status})`
    );
  }

  return {
    reference: String(body.reference ?? "").trim(),
    verseText: String(body.verseText ?? "").trim(),
    translation: String(body.translation ?? "").trim(),
    source: body.source === "cache" ? "cache" : "live",
  };
}

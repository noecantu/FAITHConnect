export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { isMissingTableError } from "@/app/lib/supabase/schema-errors";
import { getAvailableScriptureTranslations } from "@/app/lib/scripture/translations";

type ScriptureLookupResult = {
  reference: string;
  verseText: string;
  translation: string;
  source: "live" | "cache";
};

type ScriptureCacheRow = {
  cache_key: string;
  reference: string;
  translation: string;
  verse_text: string;
  updated_at: string;
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function normalizePart(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function makeCacheKey(reference: string, translation: string) {
  return `${normalizePart(reference)}::${normalizePart(translation)}`;
}

function parseReference(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 140) return null;
  return trimmed;
}

function parseTranslation(value: unknown): string {
  if (typeof value !== "string") return "kjv";
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "kjv";
  if (trimmed.length > 20) return "kjv";
  return trimmed;
}

async function resolveTranslation(translation: string): Promise<string> {
  try {
    const available = await getAvailableScriptureTranslations();
    const allowedIds = new Set(available.map((item) => item.id));
    if (!allowedIds.has(translation)) {
      throw new Error(`Translation '${translation}' is not available`);
    }
    return translation;
  } catch (error) {
    if (error instanceof Error && error.message.includes("is not available")) {
      throw error;
    }
    // If translation catalog fails to load, keep lookup functional.
    return translation;
  }
}

async function readCachedLookup(cacheKey: string): Promise<ScriptureLookupResult | null> {
  const { data, error } = await adminDb
    .from("scripture_cache")
    .select("cache_key, reference, translation, verse_text, updated_at")
    .eq("cache_key", cacheKey)
    .maybeSingle<ScriptureCacheRow>();

  if (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }

  if (!data) return null;

  const updatedAt = Date.parse(data.updated_at);
  if (Number.isFinite(updatedAt) && Date.now() - updatedAt > CACHE_TTL_MS) {
    return null;
  }

  return {
    reference: data.reference,
    verseText: data.verse_text,
    translation: data.translation,
    source: "cache",
  };
}

async function writeCachedLookup(cacheKey: string, result: Omit<ScriptureLookupResult, "source">): Promise<void> {
  const { error } = await adminDb
    .from("scripture_cache")
    .upsert(
      {
        cache_key: cacheKey,
        reference: result.reference,
        translation: result.translation,
        verse_text: result.verseText,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "cache_key" }
    );

  if (error && !isMissingTableError(error)) {
    throw error;
  }
}

async function fetchFromBibleApi(reference: string, translation: string): Promise<Omit<ScriptureLookupResult, "source">> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const base = `https://bible-api.com/${encodeURIComponent(reference)}`;
    const url = new URL(base);
    url.searchParams.set("translation", translation);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null) as Record<string, unknown> | null;

    if (!response.ok || !payload) {
      const message = typeof payload?.error === "string" ? payload.error : "Lookup failed";
      throw new Error(message);
    }

    const resolvedReference = typeof payload.reference === "string" ? payload.reference.trim() : reference;
    const verseText = typeof payload.text === "string" ? payload.text.trim() : "";
    const resolvedTranslation =
      typeof payload.translation_id === "string" && payload.translation_id.trim().length > 0
        ? payload.translation_id.trim()
        : translation;

    if (!verseText) {
      throw new Error("No verse text returned for that reference");
    }

    return {
      reference: resolvedReference,
      verseText,
      translation: resolvedTranslation,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const reference = parseReference(body?.reference);
    const requestedTranslation = parseTranslation(body?.translation);

    if (!reference) {
      return NextResponse.json({ error: "A scripture reference is required" }, { status: 400 });
    }

    const translation = await resolveTranslation(requestedTranslation);

    const cacheKey = makeCacheKey(reference, translation);

    const cached = await readCachedLookup(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const live = await fetchFromBibleApi(reference, translation);

    await writeCachedLookup(cacheKey, live);

    return NextResponse.json({
      ...live,
      source: "live",
    } satisfies ScriptureLookupResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

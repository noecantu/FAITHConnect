export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

function isMissingSectionNamesTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = String((error as { message?: unknown }).message ?? "").toLowerCase();
  const code = String((error as { code?: unknown }).code ?? "").toLowerCase();
  return (
    message.includes("public.section_names") &&
    (message.includes("could not find the table") || code === "pgrst205")
  );
}

async function getSectionNamesFromSetlists(churchId: string): Promise<Array<{ id: string; title: string }>> {
  const { data, error } = await adminDb
    .from("setlists")
    .select("sections")
    .eq("church_id", churchId);

  if (error || !data) return [];

  const titles = new Set<string>();

  for (const row of data as Array<{ sections?: unknown }>) {
    const sections = Array.isArray(row.sections) ? row.sections : [];
    for (const section of sections) {
      const title =
        section &&
        typeof section === "object" &&
        typeof (section as { title?: unknown }).title === "string"
          ? (section as { title: string }).title.trim()
          : "";
      if (title.length > 0) titles.add(title);
    }
  }

  return Array.from(titles)
    .sort((a, b) => a.localeCompare(b))
    .map((title) => ({ id: `derived:${title.toLowerCase()}`, title }));
}

async function insertSectionName(params: { churchId: string; title: string }) {
  const { churchId, title } = params;

  const firstAttempt = await adminDb
    .from("section_names")
    .insert({ church_id: churchId, title })
    .select("id, title")
    .single();

  if (!firstAttempt.error) {
    return firstAttempt;
  }

  const needsCreatedAt =
    typeof firstAttempt.error.message === "string" &&
    firstAttempt.error.message.toLowerCase().includes("created_at") &&
    firstAttempt.error.message.toLowerCase().includes("null");

  if (!needsCreatedAt) {
    return firstAttempt;
  }

  return adminDb
    .from("section_names")
    .insert({ church_id: churchId, title, created_at: new Date().toISOString() })
    .select("id, title")
    .single();
}

function canManageChurch(params: {
  roles: string[];
  callerChurchId: string | null;
  managedChurchIds: string[];
  targetChurchId: string;
}) {
  const { roles, callerChurchId, managedChurchIds, targetChurchId } = params;

  if (callerChurchId === targetChurchId) return true;
  if (managedChurchIds.includes(targetChurchId)) return true;

  return (
    roles.includes("RootAdmin") ||
    roles.includes("SystemAdmin") ||
    roles.includes("DistrictAdmin") ||
    roles.includes("RegionalAdmin")
  );
}

async function getCaller() {
  const authUser = await getServerUser();
  if (!authUser) return null;

  const { data: caller } = await adminDb
    .from("users")
    .select("roles, church_id, managed_church_ids")
    .eq("id", authUser.id)
    .single();

  if (!caller) return null;

  return {
    roles: Array.isArray(caller.roles) ? caller.roles : [],
    callerChurchId: caller.church_id ?? null,
    managedChurchIds: Array.isArray(caller.managed_church_ids)
      ? caller.managed_church_ids
      : [],
  };
}

export async function GET(req: Request) {
  try {
    const caller = await getCaller();
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const churchId = url.searchParams.get("churchId");
    if (!churchId) {
      return NextResponse.json({ error: "Missing churchId" }, { status: 400 });
    }

    if (!canManageChurch({ ...caller, targetChurchId: churchId })) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await adminDb
      .from("section_names")
      .select("id, title")
      .eq("church_id", churchId)
      .order("title", { ascending: true });

    if (error) {
      if (isMissingSectionNamesTable(error)) {
        const items = await getSectionNamesFromSetlists(churchId);
        return NextResponse.json({ items });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const caller = await getCaller();
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const churchId = typeof body?.churchId === "string" ? body.churchId : null;
    const title = typeof body?.title === "string" ? body.title.trim() : null;
    const titles: string[] | null = Array.isArray(body?.titles)
      ? body.titles.filter((value: unknown): value is string => typeof value === "string")
      : null;

    if (!churchId) {
      return NextResponse.json({ error: "Missing churchId" }, { status: 400 });
    }

    if (!canManageChurch({ ...caller, targetChurchId: churchId })) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (title) {
      const { data: existing, error: existingError } = await adminDb
        .from("section_names")
        .select("id, title")
        .eq("church_id", churchId)
        .ilike("title", title)
        .maybeSingle();

      if (existingError && isMissingSectionNamesTable(existingError)) {
        return NextResponse.json({ item: { id: `derived:${title.toLowerCase()}`, title } });
      }

      if (existing) {
        return NextResponse.json({ item: existing });
      }

      const { data, error } = await insertSectionName({ churchId, title });

      if (error || !data) {
        if (isMissingSectionNamesTable(error)) {
          return NextResponse.json({ item: { id: `derived:${title.toLowerCase()}`, title } });
        }
        return NextResponse.json({ error: error?.message ?? "Failed to create section name" }, { status: 400 });
      }

      return NextResponse.json({ item: data });
    }

    if (titles) {
      const normalized = Array.from(
        new Set(
          titles
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
        )
      );

      if (normalized.length === 0) {
        return NextResponse.json({ items: [] });
      }

      const { data: existing, error: existingError } = await adminDb
        .from("section_names")
        .select("title")
        .eq("church_id", churchId);

      if (existingError && isMissingSectionNamesTable(existingError)) {
        const items = await getSectionNamesFromSetlists(churchId);
        const byLower = new Set(items.map((item) => item.title.toLowerCase()));
        for (const value of normalized) byLower.add(value.toLowerCase());
        const merged = Array.from(byLower)
          .sort((a, b) => a.localeCompare(b))
          .map((value) => ({ id: `derived:${value}`, title: value }));
        return NextResponse.json({ items: merged });
      }

      const existingTitles = new Set(
        (existing ?? []).map((item) => String(item.title).toLowerCase())
      );

      const missing = normalized.filter((value) => !existingTitles.has(value.toLowerCase()));
      if (missing.length > 0) {
        for (const value of missing) {
          const { error } = await insertSectionName({ churchId, title: value });
          if (error) {
            if (isMissingSectionNamesTable(error)) {
              const items = await getSectionNamesFromSetlists(churchId);
              return NextResponse.json({ items });
            }
            return NextResponse.json({ error: error.message }, { status: 400 });
          }
        }
      }

      const { data } = await adminDb
        .from("section_names")
        .select("id, title")
        .eq("church_id", churchId)
        .order("title", { ascending: true });

      return NextResponse.json({ items: data ?? [] });
    }

    return NextResponse.json({ error: "Missing title or titles" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const caller = await getCaller();
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const churchId = typeof body?.churchId === "string" ? body.churchId : null;
    const id = typeof body?.id === "string" ? body.id : null;

    if (!churchId || !id) {
      return NextResponse.json({ error: "Missing churchId or id" }, { status: 400 });
    }

    if (!canManageChurch({ ...caller, targetChurchId: churchId })) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await adminDb
      .from("section_names")
      .delete()
      .eq("id", id)
      .eq("church_id", churchId);

    if (error) {
      if (isMissingSectionNamesTable(error)) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

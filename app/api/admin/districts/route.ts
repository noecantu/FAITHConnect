export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

function splitPersonName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function isMissingColumnError(err: unknown): boolean {
  const msg = err && typeof err === "object" && "message" in err ? String((err as { message?: unknown }).message ?? "") : "";
  const code = err && typeof err === "object" && "code" in err ? String((err as { code?: unknown }).code ?? "") : "";
  return code === "42703" || msg.toLowerCase().includes("column") || msg.toLowerCase().includes("does not exist");
}

async function requireRootAdmin() {
  const authUser = await getServerUser();
  if (!authUser) return null;

  const { data: caller } = await adminDb
    .from("users")
    .select("roles")
    .eq("id", authUser.id)
    .single();

  const roles: string[] = Array.isArray(caller?.roles) ? caller.roles : [];
  if (!roles.includes("RootAdmin") && !roles.includes("SystemAdmin")) return null;
  return authUser;
}

// GET /api/admin/districts — list all districts
export async function GET() {
  try {
    const user = await requireRootAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let data: Record<string, unknown>[] | null = null;

    {
      const primary = await adminDb
        .from("districts")
        .select("id, name, state, logo_url, region_admin_name, region_admin_first_name, region_admin_last_name, region_admin_title, created_at")
        .order("name", { ascending: true });

      if (primary.error) {
        if (!isMissingColumnError(primary.error)) throw primary.error;
        const fallback = await adminDb
          .from("districts")
          .select("id, name, state, logo_url, region_admin_name, region_admin_title, created_at")
          .order("name", { ascending: true });
        if (fallback.error) throw fallback.error;
        data = (fallback.data ?? []) as Record<string, unknown>[];
      } else {
        data = (primary.data ?? []) as Record<string, unknown>[];
      }
    }

    const districts = (data ?? []).map((row) => {
      const first = typeof row.region_admin_first_name === "string" ? row.region_admin_first_name.trim() : "";
      const last = typeof row.region_admin_last_name === "string" ? row.region_admin_last_name.trim() : "";
      const fallbackFull = typeof row.region_admin_name === "string" ? row.region_admin_name.trim() : "";
      const full = [first, last].filter(Boolean).join(" ") || fallbackFull || null;

      return {
        ...row,
        region_admin_name: full,
        region_admin_first_name: first || null,
        region_admin_last_name: last || null,
      };
    });

    return NextResponse.json({ districts });
  } catch (err) {
    console.error("admin districts GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/districts — create a district
export async function POST(req: Request) {
  try {
    const user = await requireRootAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const {
      name,
      state,
      logo_url,
      region_admin_name,
      region_admin_first_name,
      region_admin_last_name,
      region_admin_title,
    } = body as Record<string, string | undefined>;

    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const adminFirst = region_admin_first_name?.trim() ?? "";
    const adminLast = region_admin_last_name?.trim() ?? "";
    const adminFullFromParts = [adminFirst, adminLast].filter(Boolean).join(" ");
    const adminLegacyFull = region_admin_name?.trim() ?? "";
    const parsedLegacy = adminLegacyFull ? splitPersonName(adminLegacyFull) : { first: "", last: "" };
    const normalizedFirst = adminFirst || parsedLegacy.first || null;
    const normalizedLast = adminLast || parsedLegacy.last || null;
    const normalizedFull = adminFullFromParts || adminLegacyFull || null;

    let data: Record<string, unknown> | null = null;

    {
      const primary = await adminDb
        .from("districts")
        .insert({
          name: name.trim(),
          state: state?.trim() || null,
          logo_url: logo_url?.trim() || null,
          region_admin_name: normalizedFull,
          region_admin_first_name: normalizedFirst,
          region_admin_last_name: normalizedLast,
          region_admin_title: region_admin_title?.trim() || null,
        })
        .select("id, name, state, logo_url, region_admin_name, region_admin_first_name, region_admin_last_name, region_admin_title, created_at")
        .single();

      if (primary.error) {
        if (!isMissingColumnError(primary.error)) throw primary.error;
        const fallback = await adminDb
          .from("districts")
          .insert({
            name: name.trim(),
            state: state?.trim() || null,
            logo_url: logo_url?.trim() || null,
            region_admin_name: normalizedFull,
            region_admin_title: region_admin_title?.trim() || null,
          })
          .select("id, name, state, logo_url, region_admin_name, region_admin_title, created_at")
          .single();
        if (fallback.error) throw fallback.error;
        data = (fallback.data ?? null) as Record<string, unknown> | null;
      } else {
        data = (primary.data ?? null) as Record<string, unknown> | null;
      }
    }

    return NextResponse.json({ district: data }, { status: 201 });
  } catch (err) {
    console.error("admin districts POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

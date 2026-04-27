export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

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

// GET /api/admin/regions — list all regions
export async function GET() {
  try {
    const user = await requireRootAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data, error } = await adminDb
      .from("regions")
      .select("id, name, state, logo_url, region_admin_name, region_admin_title, district_id, created_at")
      .order("name", { ascending: true });

    if (error) throw error;

    // Fetch district names for enrichment
    const districtIds = [...new Set((data ?? []).map((r) => r.district_id).filter(Boolean))] as string[];
    let districtNameById = new Map<string, string>();

    if (districtIds.length > 0) {
      const { data: districts } = await adminDb
        .from("districts")
        .select("id, name")
        .in("id", districtIds);

      districtNameById = new Map((districts ?? []).map((d) => [d.id, d.name]));
    }

    const regions = (data ?? []).map((r) => ({
      ...r,
      district_name: r.district_id ? (districtNameById.get(r.district_id) ?? null) : null,
    }));

    return NextResponse.json({ regions });
  } catch (err) {
    console.error("admin regions GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/regions — create a region
export async function POST(req: Request) {
  try {
    const user = await requireRootAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { name, state, logo_url, region_admin_name, region_admin_title, district_id } =
      body as Record<string, string | undefined>;

    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const { data, error } = await adminDb
      .from("regions")
      .insert({
        name: name.trim(),
        state: state?.trim() || null,
        logo_url: logo_url?.trim() || null,
        region_admin_name: region_admin_name?.trim() || null,
        region_admin_title: region_admin_title?.trim() || null,
        district_id: district_id?.trim() || null,
      })
      .select("id, name, state, logo_url, region_admin_name, region_admin_title, district_id, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ region: data }, { status: 201 });
  } catch (err) {
    console.error("admin regions POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

// GET /api/admin/districts — list all districts
export async function GET() {
  try {
    const user = await requireRootAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data, error } = await adminDb
      .from("districts")
      .select("id, name, state, logo_url, region_admin_name, region_admin_title, created_at")
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ districts: data ?? [] });
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
    const { name, state, logo_url, region_admin_name, region_admin_title } = body as Record<string, string | undefined>;

    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const { data, error } = await adminDb
      .from("districts")
      .insert({
        name: name.trim(),
        state: state?.trim() || null,
        logo_url: logo_url?.trim() || null,
        region_admin_name: region_admin_name?.trim() || null,
        region_admin_title: region_admin_title?.trim() || null,
      })
      .select("id, name, state, logo_url, region_admin_name, region_admin_title, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ district: data }, { status: 201 });
  } catch (err) {
    console.error("admin districts POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

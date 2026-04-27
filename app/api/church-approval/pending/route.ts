export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const callerUid = authUser.id;

    const { data: caller } = await adminDb
      .from("users")
      .select("roles, region_id")
      .eq("id", callerUid)
      .single();

    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles: string[] = Array.isArray(caller.roles) ? caller.roles : [];
    const isSystem = roles.includes("RootAdmin") || roles.includes("SystemAdmin");
    const isRegionalAdmin = roles.includes("RegionalAdmin");

    if (!isSystem && !isRegionalAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const countOnly = url.searchParams.get("countOnly") === "1";

    const requestedRegionId = url.searchParams.get("regionId");
    const regionId = isSystem
      ? requestedRegionId ?? caller.region_id ?? null
      : caller.region_id ?? null;

    if (!regionId) {
      return NextResponse.json({ pending: [], count: 0 });
    }

    if (countOnly) {
      const { count, error } = await adminDb
        .from("churches")
        .select("id", { count: "exact", head: true })
        .eq("region_selected_id", regionId)
        .eq("region_status", "pending");

      if (error) throw error;

      return NextResponse.json({ count: count ?? 0 });
    }

    const { data, error } = await adminDb
      .from("churches")
      .select("id, name, logo_url, leader_name, leader_title, city, state, region_selected_id, region_status, updated_at")
      .eq("region_selected_id", regionId)
      .eq("region_status", "pending")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      pending: data ?? [],
      count: (data ?? []).length,
    });
  } catch (err) {
    console.error("church-approval/pending error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

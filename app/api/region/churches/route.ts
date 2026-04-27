export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const regionId = searchParams.get("regionId")?.trim() ?? "";

    if (!regionId) {
      return NextResponse.json({ error: "Missing regionId" }, { status: 400 });
    }

    const { data: caller } = await adminDb
      .from("users")
      .select("roles, region_id")
      .eq("id", authUser.id)
      .single();

    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles: string[] = Array.isArray(caller.roles) ? caller.roles : [];
    const canManageSystem = roles.includes("RootAdmin") || roles.includes("SystemAdmin");

    if (!canManageSystem && (!roles.includes("RegionalAdmin") || caller.region_id !== regionId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: churches, error } = await adminDb
      .from("churches")
      .select("id, name, logo_url, leader_name, leader_title, address, city, state, zip, phone, timezone")
      .eq("region_id", regionId)
      .eq("region_status", "approved")
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ churches: churches ?? [] });
  } catch (error) {
    console.error("region churches error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
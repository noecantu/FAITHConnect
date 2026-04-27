export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

type DistrictUser = {
  uid: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roles?: string[];
  church_id?: string | null;
  churchName?: string;
  churchLogoUrl?: string | null;
};

export async function GET(req: Request) {
  try {
    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const districtId = searchParams.get("districtId")?.trim() ?? "";

    if (!districtId) {
      return NextResponse.json({ error: "Missing districtId" }, { status: 400 });
    }

    const { data: caller } = await adminDb
      .from("users")
      .select("roles, district_id")
      .eq("id", authUser.id)
      .single();

    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles: string[] = Array.isArray(caller.roles) ? caller.roles : [];
    const canManageSystem = roles.includes("RootAdmin") || roles.includes("SystemAdmin");

    if (!canManageSystem && (!roles.includes("DistrictAdmin") || caller.district_id !== districtId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: regions } = await adminDb
      .from("regions")
      .select("id")
      .eq("district_id", districtId);

    const regionIds = (regions ?? []).map((r) => r.id);

    if (regionIds.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const { data: churches } = await adminDb
      .from("churches")
      .select("id, name, logo_url")
      .in("region_id", regionIds);

    const churchList = churches ?? [];

    if (churchList.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const churchIds = churchList.map((c) => c.id);
    const churchNameById = new Map(churchList.map((c) => [c.id, c.name]));
    const churchLogoById = new Map(churchList.map((c) => [c.id, c.logo_url ?? null]));

    const { data: userRows } = await adminDb
      .from("users")
      .select("id, first_name, last_name, email, roles, church_id")
      .in("church_id", churchIds);

    const users: DistrictUser[] = (userRows ?? []).map((u) => ({
      uid: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      roles: Array.isArray(u.roles) ? u.roles : [],
      church_id: u.church_id,
      churchName: u.church_id ? churchNameById.get(u.church_id) ?? u.church_id : undefined,
      churchLogoUrl: u.church_id ? (churchLogoById.get(u.church_id) ?? null) : null,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("district users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
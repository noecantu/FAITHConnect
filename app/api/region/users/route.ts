export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

type RegionalUser = {
  uid: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  roles: string[];
  profile_photo_url?: string | null;
  church_id?: string | null;
};

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

    const { data: churches, error: churchesError } = await adminDb
      .from("churches")
      .select("id")
      .eq("region_id", regionId)
      .eq("region_status", "approved");

    if (churchesError) {
      throw churchesError;
    }

    const churchIds = (churches ?? []).map((church) => church.id);
    if (churchIds.length === 0) {
      return NextResponse.json({ users: [] as RegionalUser[] });
    }

    const { data: users, error: usersError } = await adminDb
      .from("users")
      .select("id, first_name, last_name, email, roles, profile_photo_url, church_id")
      .in("church_id", churchIds)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true });

    if (usersError) {
      throw usersError;
    }

    const mapped: RegionalUser[] = (users ?? []).map((user) => ({
      uid: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      roles: Array.isArray(user.roles) ? user.roles : [],
      profile_photo_url: user.profile_photo_url,
      church_id: user.church_id,
    }));

    return NextResponse.json({ users: mapped });
  } catch (error) {
    console.error("region users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
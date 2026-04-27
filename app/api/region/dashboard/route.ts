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

    const { data: user } = await adminDb
      .from("users")
      .select("roles, region_id")
      .eq("id", authUser.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles: string[] = Array.isArray(user.roles) ? user.roles : [];
    const canManageSystem = roles.includes("RootAdmin") || roles.includes("SystemAdmin");

    if (!canManageSystem && (!roles.includes("RegionalAdmin") || user.region_id !== regionId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: churches } = await adminDb
      .from("churches")
      .select("id, region_status, leader_name, leader_title")
      .eq("region_id", regionId)
      .eq("region_status", "approved");

    const approvedChurches = churches ?? [];
    const churchIds = approvedChurches.map((church) => church.id);

    if (churchIds.length === 0) {
      return NextResponse.json({
        churchCount: 0,
        memberCount: 0,
        userCount: 0,
        adminCount: 0,
        financeCount: 0,
        churchLeaderCount: 0,
        eventCount: 0,
        checkinCount: 0,
        musicItemCount: 0,
        setlistCount: 0,
      });
    }

    const [
      { count: memberCount },
      { count: eventCount },
      { count: checkinCount },
      { count: musicItemCount },
      { count: setlistCount },
      { data: churchUsers },
    ] = await Promise.all([
      adminDb.from("members").select("id", { count: "exact", head: true }).in("church_id", churchIds).eq("status", "Active"),
      adminDb.from("events").select("id", { count: "exact", head: true }).in("church_id", churchIds),
      adminDb.from("attendance").select("id", { count: "exact", head: true }).in("church_id", churchIds),
      adminDb.from("songs").select("id", { count: "exact", head: true }).in("church_id", churchIds),
      adminDb.from("setlists").select("id", { count: "exact", head: true }).in("church_id", churchIds),
      adminDb.from("users").select("id, roles").in("church_id", churchIds),
    ]);

    const userList = churchUsers ?? [];

    return NextResponse.json({
      churchCount: approvedChurches.length,
      memberCount: memberCount ?? 0,
      userCount: userList.length,
      adminCount: userList.filter((userRow) => Array.isArray(userRow.roles) && userRow.roles.includes("Admin")).length,
      financeCount: userList.filter((userRow) => Array.isArray(userRow.roles) && userRow.roles.includes("Finance")).length,
      churchLeaderCount: approvedChurches.filter((church) => church.leader_name || church.leader_title).length,
      eventCount: eventCount ?? 0,
      checkinCount: checkinCount ?? 0,
      musicItemCount: musicItemCount ?? 0,
      setlistCount: setlistCount ?? 0,
    });
  } catch (error) {
    console.error("region dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
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
    const districtId = searchParams.get("districtId")?.trim() ?? "";

    if (!districtId) {
      return NextResponse.json({ error: "Missing districtId" }, { status: 400 });
    }

    const { data: user } = await adminDb
      .from("users")
      .select("roles, district_id")
      .eq("id", authUser.id)
      .single();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles: string[] = Array.isArray(user.roles) ? user.roles : [];
    const canManageSystem = roles.includes("RootAdmin") || roles.includes("SystemAdmin");

    if (!canManageSystem && (!roles.includes("DistrictAdmin") || user.district_id !== districtId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all regions in this district
    const { data: regions } = await adminDb
      .from("regions")
      .select("id")
      .eq("district_id", districtId);

    const regionIds = (regions ?? []).map((r) => r.id);

    if (regionIds.length === 0) {
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

    // Get approved churches in those regions
    const { data: churches } = await adminDb
      .from("churches")
      .select("id, region_status, leader_name, leader_title")
      .in("region_id", regionIds)
      .eq("region_status", "approved");

    const approvedChurches = churches ?? [];
    const churchIds = approvedChurches.map((c) => c.id);

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

    // Aggregate all metrics in parallel
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
      adminCount: userList.filter((u) => Array.isArray(u.roles) && u.roles.includes("Admin")).length,
      financeCount: userList.filter((u) => Array.isArray(u.roles) && u.roles.includes("Finance")).length,
      churchLeaderCount: approvedChurches.filter((c) => c.leader_name || c.leader_title).length,
      eventCount: eventCount ?? 0,
      checkinCount: checkinCount ?? 0,
      musicItemCount: musicItemCount ?? 0,
      setlistCount: setlistCount ?? 0,
    });
  } catch (error) {
    console.error("district dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getSessionCookie(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  return cookie
    .split("; ")
    .find((entry) => entry.startsWith("session="))
    ?.split("=")[1];
}

export async function GET(req: Request) {
  try {
    const session = getSessionCookie(req);

    if (!session) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);
    
    const { searchParams } = new URL(req.url);
    const districtId = searchParams.get("districtId")?.trim() ?? "";

    if (!districtId) {
      return NextResponse.json({ error: "Missing districtId" }, { status: 400 });
    }

    const userSnap = await adminDb.from("users").select("*").eq("id", callerUid).single();
    const user = userSnap;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles = Array.isArray(user.roles) ? user.roles : [];
    const canManageSystem = roles.includes("RootAdmin") || roles.includes("SystemAdmin");

    if (!canManageSystem && (!roles.includes("DistrictAdmin") || user.districtId !== districtId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const regionsSnap = await adminDb
      .collection("regions")
      .where("districtId", "==", districtId)
      .get();

    const regionIds = regionsSnap.docs.map((doc) => doc.id);

    if (regionIds.length === 0) {
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

    const churchSnapshots = await Promise.all(
      regionIds.map((regionId) => adminDb.collection("churches").where("regionId", "==", regionId).get())
    );

    const churches = churchSnapshots.flatMap((snapshot) =>
      snapshot.docs.map((doc) => ({ id: doc.id, ...doc }))
    ) as Array<{
      id: string;
      regionStatus?: string;
      leaderName?: string | null;
      leaderTitle?: string | null;
    }>;

    const approvedChurches = churches.filter((church) => church.regionStatus === "approved");

    const userSnapshots = await Promise.all(
      churches.map((church) => adminDb.collection("users").where("church_id", "==", church.id).get())
    );

    const users = new Map<string, { roles?: string[] }>();

    userSnapshots.forEach((snapshot) => {
      snapshot.docs.forEach((doc) => {
        users.set(doc.id, doc as { roles?: string[] });
      });
    });

    const approvedMetrics = await Promise.all(
      approvedChurches.map(async (church) => {
        const churchRef = adminDb.collection("churches").doc(church.id);
        const [eventsSnap, attendanceSnap, songsSnap, setlistsSnap, membersSnap] = await Promise.all([
          churchRef.collection("events").get(),
          churchRef.collection("attendance").get(),
          churchRef.collection("songs").get(),
          churchRef.collection("setlists").get(),
          churchRef.collection("members").where("status", "==", "Active").get(),
        ]);

        const checkins = attendanceSnap.docs.reduce(
          (total, attendanceDoc) => total + countPresentAttendanceEntries(attendanceDoc),
          0
        );

        return {
          events: eventsSnap.size,
          checkins,
          music: songsSnap.size,
          setlists: setlistsSnap.size,
          members: membersSnap.size,
        };
      })
    );

    const userList = Array.from(users.values());

    return NextResponse.json({
      churchCount: approvedChurches.length,
      memberCount: approvedMetrics.reduce((sum, metric) => sum + metric.members, 0),
      userCount: userList.length,
      adminCount: userList.filter((userRecord) => Array.isArray(userRecord.roles) && userRecord.roles.includes("Admin")).length,
      financeCount: userList.filter((userRecord) => Array.isArray(userRecord.roles) && userRecord.roles.includes("Finance")).length,
      churchLeaderCount: approvedChurches.filter((church) => church.leaderName || church.leaderTitle).length,
      eventCount: approvedMetrics.reduce((sum, metric) => sum + metric.events, 0),
      checkinCount: approvedMetrics.reduce((sum, metric) => sum + metric.checkins, 0),
      musicItemCount: approvedMetrics.reduce((sum, metric) => sum + metric.music, 0),
      setlistCount: approvedMetrics.reduce((sum, metric) => sum + metric.setlists, 0),
    });
  } catch (error) {
    console.error("district dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
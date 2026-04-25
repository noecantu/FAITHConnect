export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { countPresentAttendanceEntries } from "@/app/lib/attendance-count";

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
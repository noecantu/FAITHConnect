//app/(dashboard)/admin/district/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { usePermissions } from "@/app/hooks/usePermissions";
import { countPresentAttendanceEntries } from "@/app/lib/attendance-count";
import { getUsersByChurchIds } from "@/app/lib/regional-users";
import Link from "next/link";
import {
  Activity,
  Building2,
  Calendar,
  ListMusic,
  MapPinned,
  Music4,
  Shield,
  Users,
  Wallet,
} from "lucide-react";

type DistrictRegion = { id: string; name: string };
type DistrictChurch = { id: string; regionId?: string; regionStatus?: string; leaderName?: string | null; leaderTitle?: string | null };
type DistrictUser = { uid: string; roles?: string[] };

export default function DistrictDashboardPage() {
  const { isDistrictAdmin, districtId, loading: permLoading } = usePermissions();

  const [districtName, setDistrictName] = useState("");
  const [districtAdminName, setDistrictAdminName] = useState("");
  const [districtState, setDistrictState] = useState("");
  const [districtTitle, setDistrictTitle] = useState("");
  const [regions, setRegions] = useState<DistrictRegion[]>([]);
  const [churches, setChurches] = useState<DistrictChurch[]>([]);
  const [users, setUsers] = useState<DistrictUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [checkinCount, setCheckinCount] = useState(0);
  const [musicItemCount, setMusicItemCount] = useState(0);
  const [setlistCount, setSetlistCount] = useState(0);

  // Load district details
  useEffect(() => {
    if (!districtId) return;

    const unsub = onSnapshot(
      collection(db, "districts"),
      (snap) => {
        const d = snap.docs.find((doc) => doc.id === districtId);
        if (d) {
          const data = d.data();
          setDistrictName(data.name || "Your District");
          setDistrictAdminName(data.regionAdminName || "");
          setDistrictTitle(data.regionAdminTitle || "");
          setDistrictState(data.state || "");
        }
      },
      (error) => {
        if ((error as { code?: string }).code !== "permission-denied") console.error("district details error:", error);
      }
    );

    return () => unsub();
  }, [districtId]);

  // Load approved regions in this district
  useEffect(() => {
    if (!districtId) return;

    const q = query(collection(db, "regions"), where("districtId", "==", districtId));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setRegions(snap.docs.map((d) => ({ id: d.id, name: d.data().name || "Unknown" })));
        setLoading(false);
      },
      (error) => {
        if ((error as { code?: string }).code !== "permission-denied") console.error("district regions error:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [districtId]);

  // Load pending region requests
  useEffect(() => {
    if (!districtId) return;

    const q = query(
      collection(db, "regions"),
      where("districtSelectedId", "==", districtId),
      where("districtStatus", "==", "pending")
    );

    const unsub = onSnapshot(
      q,
      (snap) => setPendingCount(snap.size),
      (error) => { if ((error as { code?: string }).code !== "permission-denied") console.error("pending regions error:", error); }
    );

    return () => unsub();
  }, [districtId]);

  // Load churches across all regions
  useEffect(() => {
    if (loading) return;

    if (regions.length === 0) {
      setChurches([]);
      return;
    }

    let active = true;

    const load = async () => {
      try {
        const allChurches: DistrictChurch[] = [];

        await Promise.all(
          regions.map(async (region) => {
            const snap = await getDocs(
              query(collection(db, "churches"), where("regionId", "==", region.id))
            );
            snap.docs.forEach((d) => allChurches.push({ id: d.id, ...d.data() } as DistrictChurch));
          })
        );

        if (active) setChurches(allChurches);
      } catch (err) {
        console.error("Error loading district churches:", err);
        if (active) setChurches([]);
      }
    };

    load();
    return () => { active = false; };
  }, [regions, loading]);

  // Load users
  useEffect(() => {
    if (churches.length === 0) {
      setUsers([]);
      setUsersLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      setUsersLoading(true);
      try {
        const result = await getUsersByChurchIds(churches.map((c) => c.id));
        if (active) setUsers(result as DistrictUser[]);
      } catch {
        if (active) setUsers([]);
      } finally {
        if (active) setUsersLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [churches]);

  // Load aggregate metrics
  useEffect(() => {
    if (loading) return;

    const approved = churches.filter((c) => c.regionStatus === "approved");

    if (approved.length === 0) {
      setEventCount(0); setCheckinCount(0); setMusicItemCount(0); setSetlistCount(0);
      setMetricsLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      setMetricsLoading(true);
      try {
        const metrics = await Promise.all(
          approved.map(async (church) => {
            const [eventsSnap, attendanceSnap, musicSnap, setlistSnap] = await Promise.all([
              getDocs(collection(db, "churches", church.id, "events")),
              getDocs(collection(db, "churches", church.id, "attendance")),
              getDocs(collection(db, "churches", church.id, "songs")),
              getDocs(collection(db, "churches", church.id, "setlists")),
            ]);

            const checkins = attendanceSnap.docs.reduce(
              (t, d) => t + countPresentAttendanceEntries(d.data()),
              0
            );

            return { events: eventsSnap.size, checkins, music: musicSnap.size, setlists: setlistSnap.size };
          })
        );

        if (!active) return;
        setEventCount(metrics.reduce((s, m) => s + m.events, 0));
        setCheckinCount(metrics.reduce((s, m) => s + m.checkins, 0));
        setMusicItemCount(metrics.reduce((s, m) => s + m.music, 0));
        setSetlistCount(metrics.reduce((s, m) => s + m.setlists, 0));
      } catch (err) {
        console.error("Error loading district metrics:", err);
      } finally {
        if (active) setMetricsLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [churches, loading]);

  const approvedChurches = churches.filter((c) => c.regionStatus === "approved");
  const adminCount = users.filter((u) => Array.isArray(u.roles) && u.roles.includes("Admin")).length;
  const financeCount = users.filter((u) => Array.isArray(u.roles) && u.roles.includes("Finance")).length;
  const churchLeaderCount = approvedChurches.filter((c) => (c.leaderName || c.leaderTitle)).length;

  if (permLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;

  if (!isDistrictAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  if (loading || usersLoading || metricsLoading) {
    return <div className="p-6 text-muted-foreground">Loading district data…</div>;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">District Dashboard</h1>
        <p className="text-muted-foreground">Overview of regions and churches in your district.</p>
      </div>

      {/* Pending Regions Alert */}
      {pendingCount > 0 && (
        <div className="p-4 rounded-lg border border-yellow-500 bg-yellow-500/10">
          <h2 className="text-lg font-semibold">Regions Pending Approval</h2>
          <p className="text-xl font-bold mt-1.5">{pendingCount}</p>
          <Link href="/admin/district/regions/pending" className="text-sm underline mt-2 inline-block">
            Review Pending Regions
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">

        {/* District Info Card */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">District</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <MapPinned className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <p className="text-xl font-bold mt-1.5">{districtName}</p>
          {districtAdminName && (
            <p className="text-sm text-muted-foreground mt-1">
              {districtTitle ? `${districtTitle}: ` : "Admin: "}{districtAdminName}
            </p>
          )}
          {districtState && (
            <p className="text-xs text-muted-foreground mt-1 opacity-70">{districtState}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1 opacity-60">ID: {districtId}</p>
        </div>

        {/* Regions */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Regions</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <MapPinned className="h-4 w-4 text-indigo-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-1.5">{regions.length}</p>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Approved regions in this district</p>
        </div>

        {/* Churches */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Churches</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <Building2 className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-1.5">{approvedChurches.length}</p>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Approved churches across regions</p>
        </div>

        {/* Users */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Users</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-1.5">{users.length}</p>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Users in churches within this district</p>
        </div>

        {/* Admins */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Admins</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <Shield className="h-4 w-4 text-fuchsia-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-1.5">{adminCount}</p>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Church admins in this district</p>
        </div>

        {/* Events */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Events</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <Calendar className="h-4 w-4 text-sky-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-1.5">{eventCount}</p>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Events across district churches</p>
        </div>

        {/* Check-ins */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Check-ins</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <Activity className="h-4 w-4 text-amber-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-1.5">{checkinCount}</p>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Attendance entries across district churches</p>
        </div>

        {/* Music Items */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Music Items</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <Music4 className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-1.5">{musicItemCount}</p>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Songs across district churches</p>
        </div>

        {/* Setlists */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Setlists</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <ListMusic className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-1.5">{setlistCount}</p>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Setlists across district churches</p>
        </div>

        {/* Church Leaders */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Church Leaders</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-1.5">{churchLeaderCount}</p>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Approved churches with leader info</p>
        </div>

        {/* Finance Managers */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Finance Managers</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <Wallet className="h-4 w-4 text-teal-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-1.5">{financeCount}</p>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Users with Finance role in district churches</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-col gap-3">
          <Link href="/admin/district/regions" className="px-4 py-2 rounded-md border bg-muted/20 hover:bg-muted transition">
            View Regions
          </Link>
          <Link href="/admin/district/users" className="px-4 py-2 rounded-md border bg-muted/20 hover:bg-muted transition">
            View District Members
          </Link>
          {pendingCount > 0 && (
            <Link href="/admin/district/regions/pending" className="px-4 py-2 rounded-md border border-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 transition">
              Review Pending Regions ({pendingCount})
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

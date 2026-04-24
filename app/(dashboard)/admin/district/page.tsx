//app/(dashboard)/admin/district/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { usePermissions } from "@/app/hooks/usePermissions";
import { countPresentAttendanceEntries } from "@/app/lib/attendance-count";
import { getUsersByChurchIds } from "@/app/lib/regional-users";
import { PageHeader } from "@/app/components/page-header";
import {
  DashboardApprovalBanner,
  DashboardMetricCard,
  DashboardQuickActionsCard,
  DashboardSummaryCard,
} from "@/app/components/ui/dashboard-cards";
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
  const [districtLogoUrl, setDistrictLogoUrl] = useState<string | null>(null);
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
          setDistrictLogoUrl(data.logoUrl ?? null);
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
  const districtChips = [districtState, districtId ? `ID ${districtId.slice(0, 8)}...` : "No ID"].filter(Boolean) as string[];
  const quickActions = [
    { href: "/admin/district/regions", label: "View Regions", variant: "outline" as const },
    { href: "/admin/district/users", label: "View District Members", variant: "outline" as const },
    ...(pendingCount > 0
      ? [{ href: "/admin/district/regions/pending", label: `Review Pending Regions (${pendingCount})`, variant: "default" as const }]
      : []),
  ];

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
      <PageHeader
        title="District Dashboard"
        subtitle="Overview of regions, churches, users, and activity across your district."
      />

      {/* Pending Regions Alert */}
      {pendingCount > 0 && (
        <DashboardApprovalBanner
          eyebrow="Approval Queue"
          title="Regions Pending Approval"
          description={`${pendingCount} region${pendingCount === 1 ? " is" : "s are"} waiting for district approval.`}
          count={pendingCount}
          countLabel="Pending"
          href="/admin/district/regions/pending"
          actionLabel="Review Requests"
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">

        {/* District Info Card */}
        <DashboardSummaryCard
          eyebrow="District"
          name={districtName}
          subtitle={`${districtTitle ? `${districtTitle}: ` : "Admin: "}${districtAdminName || "District Admin"}`}
          logoUrl={districtLogoUrl}
          logoAlt={`${districtName} logo`}
          fallback={districtName
            .split(" ")
            .map((word) => word[0]?.toUpperCase())
            .join("")
            .slice(0, 2)}
          chips={districtChips}
        />

        {/* Regions */}
        <DashboardMetricCard
          title="Regions"
          value={regions.length}
          description="Approved regions in this district"
          icon={<MapPinned className="h-4 w-4 text-indigo-500" />}
        />

        {/* Churches */}
        <DashboardMetricCard
          title="Churches"
          value={approvedChurches.length}
          description="Approved churches across regions"
          icon={<Building2 className="h-4 w-4 text-emerald-500" />}
        />

        {/* Users */}
        <DashboardMetricCard
          title="Users"
          value={users.length}
          description="Users in churches within this district"
          icon={<Users className="h-4 w-4 text-blue-500" />}
        />

        {/* Admins */}
        <DashboardMetricCard
          title="Admins"
          value={adminCount}
          description="Church admins in this district"
          icon={<Shield className="h-4 w-4 text-fuchsia-500" />}
        />

        {/* Events */}
        <DashboardMetricCard title="Events" value={eventCount} description="Events across district churches" icon={<Calendar className="h-4 w-4 text-sky-500" />} />

        {/* Check-ins */}
        <DashboardMetricCard title="Check-ins" value={checkinCount} description="Attendance entries across district churches" icon={<Activity className="h-4 w-4 text-amber-500" />} />

        {/* Music Items */}
        <DashboardMetricCard title="Music Items" value={musicItemCount} description="Songs across district churches" icon={<Music4 className="h-4 w-4 text-emerald-500" />} />

        {/* Setlists */}
        <DashboardMetricCard title="Setlists" value={setlistCount} description="Setlists across district churches" icon={<ListMusic className="h-4 w-4 text-emerald-500" />} />

        {/* Church Leaders */}
        <DashboardMetricCard title="Church Leaders" value={churchLeaderCount} description="Approved churches with leader info" icon={<Users className="h-4 w-4 text-blue-500" />} />

        {/* Finance Managers */}
        <DashboardMetricCard title="Finance Managers" value={financeCount} description="Users with Finance role in district churches" icon={<Wallet className="h-4 w-4 text-teal-500" />} />
      </div>

      {/* Quick Actions */}
      <DashboardQuickActionsCard
        title="Quick Actions"
        description="Jump into district management tasks and approval workflows."
        actions={quickActions}
      />
    </div>
  );
}

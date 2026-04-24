//app/(dashboard)/admin/district/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { usePermissions } from "@/app/hooks/usePermissions";
import { PageHeader } from "@/app/components/page-header";
import {
  DashboardIdentityCard,
  DashboardMetricCard,
  DashboardQuickActionsCard,
} from "@/app/components/ui/dashboard-cards";
import {
  Activity,
  Building2,
  Calendar,
  ListMusic,
  MapPinned,
  Music4,
  Shield,
  UserCheck,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

type DistrictRegion = { id: string; name: string };
type DistrictDashboardMetrics = {
  churchCount: number;
  memberCount: number;
  userCount: number;
  adminCount: number;
  financeCount: number;
  churchLeaderCount: number;
  eventCount: number;
  checkinCount: number;
  musicItemCount: number;
  setlistCount: number;
};

export default function DistrictDashboardPage() {
  const { isDistrictAdmin, districtId, loading: permLoading } = usePermissions();

  const [districtName, setDistrictName] = useState("");
  const [districtAdminName, setDistrictAdminName] = useState("");
  const [districtState, setDistrictState] = useState("");
  const [districtTitle, setDistrictTitle] = useState("");
  const [districtLogoUrl, setDistrictLogoUrl] = useState<string | null>(null);
  const [regions, setRegions] = useState<DistrictRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [metrics, setMetrics] = useState<DistrictDashboardMetrics>({
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

  // Load district details
  useEffect(() => {
    if (!districtId) return;

    const unsub = onSnapshot(
      doc(db, "districts", districtId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
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

  // Load district-only aggregates through an admin-backed API because
  // district admins cannot list churches/users/subcollections client-side.
  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!districtId) {
        if (active) setDashboardLoading(false);
        return;
      }

      setDashboardLoading(true);

      try {
        const res = await fetch(`/api/district/dashboard?districtId=${encodeURIComponent(districtId)}`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to load district dashboard metrics (${res.status})`);
        }

        const data = (await res.json()) as Partial<DistrictDashboardMetrics>;

        if (active) {
          setMetrics({
            churchCount: data.churchCount ?? 0,
            memberCount: data.memberCount ?? 0,
            userCount: data.userCount ?? 0,
            adminCount: data.adminCount ?? 0,
            financeCount: data.financeCount ?? 0,
            churchLeaderCount: data.churchLeaderCount ?? 0,
            eventCount: data.eventCount ?? 0,
            checkinCount: data.checkinCount ?? 0,
            musicItemCount: data.musicItemCount ?? 0,
            setlistCount: data.setlistCount ?? 0,
          });
        }
      } catch (error) {
        console.error("Error loading district dashboard metrics:", error);
        if (active) {
          setMetrics({
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
      } finally {
        if (active) setDashboardLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [districtId]);

  const quickActions = [
    { href: "/admin/district/regions", label: "View Regions", variant: "outline" as const },
    { href: "/admin/district/users", label: "View Regional Users", variant: "outline" as const },
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

  if (loading || dashboardLoading) {
    return <div className="p-6 text-muted-foreground">Loading district data…</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="District Dashboard"
        subtitle="Overview of regions, churches, users, and activity across your district."
      />

      {/* Identity Header */}
      <DashboardIdentityCard
        eyebrow="District"
        logoUrl={districtLogoUrl}
        logoAlt={`${districtName} logo`}
        fallback={districtName.split(" ").map((w) => w[0]?.toUpperCase()).join("").slice(0, 2) || "D"}
        name={districtName}
        subtitle={`${districtTitle ? `${districtTitle}: ` : "Admin: "}${districtAdminName || "District Admin"}`}
        details={districtState ? [districtState] : []}
        panelTitle="District Info"
        panelRows={[
          { label: "District ID", value: districtId ? `${districtId.slice(0, 8)}…` : "—" },
          { label: "Approved Regions", value: String(regions.length) },
          { label: "Pending", value: String(pendingCount), highlighted: pendingCount > 0, href: pendingCount > 0 ? "/admin/district/regions/pending" : undefined },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">

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
          value={metrics.churchCount}
          description="Approved churches across regions"
          icon={<Building2 className="h-4 w-4 text-emerald-500" />}
        />

        {/* Members */}
        <DashboardMetricCard
          title="Members"
          value={metrics.memberCount}
          description="Active members across district churches"
          icon={<UserCheck className="h-4 w-4 text-cyan-500" />}
        />

        {/* Users */}
        <DashboardMetricCard
          title="Users"
          value={metrics.userCount}
          description="User accounts tied to district churches"
          icon={<UserCog className="h-4 w-4 text-blue-500" />}
        />

        {/* Admins */}
        <DashboardMetricCard
          title="Admins"
          value={metrics.adminCount}
          description="User accounts with Admin access"
          icon={<Shield className="h-4 w-4 text-fuchsia-500" />}
        />

        {/* Events */}
        <DashboardMetricCard title="Events" value={metrics.eventCount} description="Events across district churches" icon={<Calendar className="h-4 w-4 text-sky-500" />} />

        {/* Check-ins */}
        <DashboardMetricCard title="Check-ins" value={metrics.checkinCount} description="Attendance entries across district churches" icon={<Activity className="h-4 w-4 text-amber-500" />} />

        {/* Music Items */}
        <DashboardMetricCard title="Music Items" value={metrics.musicItemCount} description="Songs across district churches" icon={<Music4 className="h-4 w-4 text-emerald-500" />} />

        {/* Setlists */}
        <DashboardMetricCard title="Setlists" value={metrics.setlistCount} description="Setlists across district churches" icon={<ListMusic className="h-4 w-4 text-emerald-500" />} />

        {/* Church Leaders */}
        <DashboardMetricCard title="Church Leaders" value={metrics.churchLeaderCount} description="Approved churches with leadership assigned" icon={<Users className="h-4 w-4 text-blue-500" />} />

        {/* Finance Managers */}
        <DashboardMetricCard title="Finance Managers" value={metrics.financeCount} description="User accounts with Finance access" icon={<Wallet className="h-4 w-4 text-teal-500" />} />
      </div>

      {/* Quick Actions */}
      <DashboardQuickActionsCard
        title="Quick Actions"
        description="Jump into district management tasks and management workflows."
        actions={quickActions}
      />
    </div>
  );
}

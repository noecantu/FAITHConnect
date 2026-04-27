//app(dashboard)/admin/regional/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { usePermissions } from '@/app/hooks/usePermissions';
import { PageHeader } from '@/app/components/page-header';
import {
  DashboardIdentityCard,
  DashboardMetricCard,
  DashboardQuickActionsCard,
} from '@/app/components/ui/dashboard-cards';
import {
  Activity,
  Building2,
  Calendar,
  ListMusic,
  Music4,
  Shield,
  UserCheck,
  UserCog,
  Users,
  DollarSign,
} from 'lucide-react';

type RegionalDashboardMetrics = {
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

export default function RegionalDashboardPage() {
  const { isRegionalAdmin, regionId, loading: permLoading } = usePermissions();

  const [regionName, setRegionName] = useState('');
  const [region_admin_name, setRegionAdminName] = useState('');
  const [region_admin_title, setRegionAdminTitle] = useState('');
  const [regionLogoUrl, setRegionLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [metrics, setMetrics] = useState<RegionalDashboardMetrics>({
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

  // Load region details
  useEffect(() => {
    if (!regionId) {
      setLoading(false);
      return;
    }

    let active = true;

    const loadRegion = async () => {
      setLoading(true);

      try {
        const { data } = await getSupabaseClient()
          .from('regions')
          .select('*')
          .eq('id', regionId)
          .single();

        if (!active || !data) return;

        setRegionName(data.name || 'Unknown Region');
        setRegionAdminName(data.region_admin_name || '');
        setRegionAdminTitle(data.region_admin_title || '');
        setRegionLogoUrl(data.logo_url ?? null);
      } catch (err) {
        console.error('Error loading region details:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRegion();

    return () => { active = false; };
  }, [regionId]);

  // Load region dashboard metrics through an admin-backed API because
  // regional admins cannot reliably aggregate cross-church data client-side.
  useEffect(() => {
    if (!regionId) {
      setDashboardLoading(false);
      return;
    }

    let active = true;

    const load = async () => {
      setDashboardLoading(true);

      try {
        const res = await fetch(`/api/region/dashboard?regionId=${encodeURIComponent(regionId)}`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error(`Failed to load regional dashboard metrics (${res.status})`);
        }

        const data = (await res.json()) as Partial<RegionalDashboardMetrics>;

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
      } catch (err) {
        console.error('Error loading regional dashboard metrics:', err);
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
  }, [regionId]);

  // Load pending churches (requested to join this region but not approved)
  useEffect(() => {
    if (!regionId) return;
    let active = true;

    fetch('/api/church-approval/pending?countOnly=1', {
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load pending count (${res.status})`);
        }

        const body = await res.json();
        if (!active) return;
        setPendingCount(typeof body?.count === 'number' ? body.count : 0);
      })
      .catch((err) => {
        console.error('Error loading pending church count:', err);
        if (!active) return;
        setPendingCount(0);
      });

    return () => { active = false; };
  }, [regionId]);

  const quickActions = [
    { href: '/admin/regional/churches', label: 'View Regional Churches', variant: 'outline' as const },
    { href: '/admin/regional/users', label: 'View Regional Users', variant: 'outline' as const },
    { href: '/admin/reports', label: 'View Reports', variant: 'outline' as const },
  ];

  // Permission check
  if (permLoading) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  if (!isRegionalAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  if (loading || dashboardLoading) {
    return <div className="p-6 text-muted-foreground">Loading regional data…</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Regional Dashboard"
        subtitle="Overview of churches, users, and ministry activity in your region."
      />

      {/* Identity Header */}
      <DashboardIdentityCard
        eyebrow="Region"
        logoUrl={regionLogoUrl}
        logoAlt={`${regionName} logo`}
        fallback={regionName.split(' ').map((w) => w[0]?.toUpperCase()).join('').slice(0, 2) || 'R'}
        name={regionName}
        subtitle={region_admin_title ? `${region_admin_title}: ${region_admin_name || 'Regional Admin'}` : region_admin_name || 'Regional Admin'}
        panelTitle="Region Info"
        panelRows={[
          { label: 'Region ID', value: regionId ? `${regionId.slice(0, 8)}…` : '—' },
          { label: 'Approved Churches', value: String(metrics.churchCount) },
          { label: 'Pending', value: String(pendingCount), highlighted: pendingCount > 0, href: pendingCount > 0 ? '/admin/regional/churches/pending' : undefined },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <DashboardMetricCard title="Churches" value={metrics.churchCount} description="Approved churches in this region" icon={<Building2 className="h-4 w-4 text-emerald-500" />} />
        <DashboardMetricCard title="Members" value={metrics.memberCount} description="Active members across region churches" icon={<UserCheck className="h-4 w-4 text-cyan-500" />} />
        <DashboardMetricCard title="Users" value={metrics.userCount} description="User accounts tied to region churches" icon={<UserCog className="h-4 w-4 text-blue-500" />} />
        <DashboardMetricCard title="Admins" value={metrics.adminCount} description="User accounts with Admin access" icon={<Shield className="h-4 w-4 text-fuchsia-500" />} />
        <DashboardMetricCard title="Events" value={metrics.eventCount} description="Events across region churches" icon={<Calendar className="h-4 w-4 text-sky-500" />} />
        <DashboardMetricCard title="Check-ins" value={metrics.checkinCount} description="Attendance entries across region churches" icon={<Activity className="h-4 w-4 text-amber-500" />} />
        <DashboardMetricCard title="Music Items" value={metrics.musicItemCount} description="Songs across region churches" icon={<Music4 className="h-4 w-4 text-emerald-500" />} />
        <DashboardMetricCard title="Setlists" value={metrics.setlistCount} description="Setlists across region churches" icon={<ListMusic className="h-4 w-4 text-emerald-500" />} />
        <DashboardMetricCard title="Church Leaders" value={metrics.churchLeaderCount} description="Approved churches with leadership assigned" icon={<Users className="h-4 w-4 text-blue-500" />} />
        <DashboardMetricCard title="Finance Managers" value={metrics.financeCount} description="User accounts with Finance access" icon={<DollarSign className="h-4 w-4 text-teal-500" />} />
      </div>

      {/* Quick Actions */}
      <DashboardQuickActionsCard
        title="Quick Actions"
        description="Jump into regional management tasks and approval workflows."
        actions={quickActions}
      />
    </div>
  );
}

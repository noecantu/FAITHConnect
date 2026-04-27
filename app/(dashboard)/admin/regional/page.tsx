//app(dashboard)/admin/regional/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { usePermissions } from '@/app/hooks/usePermissions';
import { getUsersByChurchIds } from '@/app/lib/regional-users';
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
  Wallet,
} from 'lucide-react';

type RegionalChurch = {
  id: string;
  region_status?: string;
  leader_name?: string | null;
  leader_title?: string | null;
};

type RegionalUser = {
  uid: string;
  roles?: string[];
};

export default function RegionalDashboardPage() {
  const { isRegionalAdmin, regionId, loading: permLoading } = usePermissions();

  const [churches, setChurches] = useState<RegionalChurch[]>([]);
  const [users, setUsers] = useState<RegionalUser[]>([]);
  const [regionName, setRegionName] = useState('');
  const [region_admin_name, setRegionAdminName] = useState('');
  const [region_admin_title, setRegionAdminTitle] = useState('');
  const [regionLogoUrl, setRegionLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [checkinCount, setCheckinCount] = useState(0);
  const [musicItemCount, setMusicItemCount] = useState(0);
  const [setlistCount, setSetlistCount] = useState(0);

  // Load region details
  useEffect(() => {
    if (!regionId) return;
    let active = true;

    getSupabaseClient()
      .from('regions')
      .select('*')
      .eq('id', regionId)
      .single()
      .then(({ data }) => {
        if (!active || !data) return;
        setRegionName(data.name || 'Unknown Region');
        setRegionAdminName(data.region_admin_name || '');
        setRegionAdminTitle(data.region_admin_title || '');
        setRegionLogoUrl(data.logo_url ?? null);
      });

    return () => { active = false; };
  }, [regionId]);

  // Load churches in region
  useEffect(() => {
    if (!regionId) return;
    let active = true;

    getSupabaseClient()
      .from('churches')
      .select('id, region_status, leader_name, leader_title')
      .eq('region_id', regionId)
      .then(({ data }) => {
        if (!active) return;
        setChurches((data ?? []) as RegionalChurch[]);
        setLoading(false);
      });

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

  // Load users belonging to churches in this region
  useEffect(() => {
    if (loading) return;

    const churchIds = churches.map((c) => c.id).filter(Boolean);

    if (churchIds.length === 0) {
      setUsers([]);
      setUsersLoading(false);
      return;
    }

    let active = true;

    (async () => {
      setUsersLoading(true);
      try {
        const regionUsers = await getUsersByChurchIds(churchIds);
        if (!active) return;
        setUsers(regionUsers as RegionalUser[]);
      } catch (err) {
        console.error('regional users load error:', err);
        if (active) setUsers([]);
      } finally {
        if (active) setUsersLoading(false);
      }
    })();

    return () => { active = false; };
  }, [churches, loading]);

  // Load regional aggregate metrics
  useEffect(() => {
    if (loading) return;

    const approvedChurches = churches.filter((c) => c.region_status === 'approved');
    const churchIds = approvedChurches.map((c) => c.id);

    if (churchIds.length === 0) {
      setMemberCount(0);
      setEventCount(0);
      setCheckinCount(0);
      setMusicItemCount(0);
      setSetlistCount(0);
      setMetricsLoading(false);
      return;
    }

    let active = true;
    const supabase = getSupabaseClient();

    (async () => {
      setMetricsLoading(true);
      try {
        const [
          { count: members },
          { count: events },
          { count: checkins },
          { count: songs },
          { count: setlists },
        ] = await Promise.all([
          supabase.from('members').select('id', { count: 'exact', head: true }).in('church_id', churchIds).eq('status', 'Active'),
          supabase.from('events').select('id', { count: 'exact', head: true }).in('church_id', churchIds),
          supabase.from('attendance').select('id', { count: 'exact', head: true }).in('church_id', churchIds),
          supabase.from('songs').select('id', { count: 'exact', head: true }).in('church_id', churchIds),
          supabase.from('setlists').select('id', { count: 'exact', head: true }).in('church_id', churchIds),
        ]);

        if (!active) return;
        setMemberCount(members ?? 0);
        setEventCount(events ?? 0);
        setCheckinCount(checkins ?? 0);
        setMusicItemCount(songs ?? 0);
        setSetlistCount(setlists ?? 0);
      } catch (err) {
        console.error('Error loading regional dashboard metrics:', err);
        if (active) {
          setMemberCount(0);
          setEventCount(0);
          setCheckinCount(0);
          setMusicItemCount(0);
          setSetlistCount(0);
        }
      } finally {
        if (active) setMetricsLoading(false);
      }
    })();

    return () => { active = false; };
  }, [churches, loading]);

  const approvedChurches = churches.filter((c) => c.region_status === 'approved');
  const adminCount = users.filter((u) => Array.isArray(u.roles) && u.roles.includes('Admin')).length;
  const financeCount = users.filter((u) => Array.isArray(u.roles) && u.roles.includes('Finance')).length;
  const churchLeaderCount = approvedChurches.filter((c) => c.leader_name || c.leader_title).length;

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

  if (loading || usersLoading || metricsLoading) {
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
          { label: 'Approved Churches', value: String(approvedChurches.length) },
          { label: 'Pending', value: String(pendingCount), highlighted: pendingCount > 0, href: pendingCount > 0 ? '/admin/regional/churches/pending' : undefined },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <DashboardMetricCard title="Churches" value={approvedChurches.length} description="Approved churches in this region" icon={<Building2 className="h-4 w-4 text-emerald-500" />} />
        <DashboardMetricCard title="Members" value={memberCount} description="Active members across region churches" icon={<UserCheck className="h-4 w-4 text-cyan-500" />} />
        <DashboardMetricCard title="Users" value={users.length} description="User accounts tied to region churches" icon={<UserCog className="h-4 w-4 text-blue-500" />} />
        <DashboardMetricCard title="Admins" value={adminCount} description="User accounts with Admin access" icon={<Shield className="h-4 w-4 text-fuchsia-500" />} />
        <DashboardMetricCard title="Events" value={eventCount} description="Events across region churches" icon={<Calendar className="h-4 w-4 text-sky-500" />} />
        <DashboardMetricCard title="Check-ins" value={checkinCount} description="Attendance entries across region churches" icon={<Activity className="h-4 w-4 text-amber-500" />} />
        <DashboardMetricCard title="Music Items" value={musicItemCount} description="Songs across region churches" icon={<Music4 className="h-4 w-4 text-emerald-500" />} />
        <DashboardMetricCard title="Setlists" value={setlistCount} description="Setlists across region churches" icon={<ListMusic className="h-4 w-4 text-emerald-500" />} />
        <DashboardMetricCard title="Church Leaders" value={churchLeaderCount} description="Approved churches with leadership assigned" icon={<Users className="h-4 w-4 text-blue-500" />} />
        <DashboardMetricCard title="Finance Managers" value={financeCount} description="User accounts with Finance access" icon={<Wallet className="h-4 w-4 text-teal-500" />} />
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

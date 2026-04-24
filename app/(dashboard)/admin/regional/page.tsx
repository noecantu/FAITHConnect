//app(dashboard)/admin/regional/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, doc, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/client';
import { usePermissions } from '@/app/hooks/usePermissions';
import { countPresentAttendanceEntries } from '@/app/lib/attendance-count';
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
  regionStatus?: string;
  leaderName?: string | null;
  leaderTitle?: string | null;
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
  const [regionAdminName, setRegionAdminName] = useState('');
  const [regionAdminTitle, setRegionAdminTitle] = useState('');
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

  // Load churches in region
  useEffect(() => {
    if (!regionId) return;

    const q = query(
      collection(db, 'churches'),
      where('regionId', '==', regionId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as RegionalChurch[];
        setChurches(list);
        setLoading(false);
      },
      (error) => {
        if ((error as { code?: string }).code !== 'permission-denied') console.error('regional churches snapshot error:', error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [regionId]);

  // Load users belonging to churches in this region
  useEffect(() => {
    if (loading) return;

    const churchIds = churches.map((church) => church.id).filter(Boolean);

    if (churchIds.length === 0) {
      setUsers([]);
      setUsersLoading(false);
      return;
    }

    let active = true;

    const loadUsers = async () => {
      setUsersLoading(true);

      try {
        if (!active) return;
        const regionUsers = await getUsersByChurchIds(churchIds);
        if (!active) return;
        setUsers(regionUsers as RegionalUser[]);
      } catch (error) {
        console.error('regional users load error:', error);
        if (active) setUsers([]);
      } finally {
        if (active) setUsersLoading(false);
      }
    };

    loadUsers();

    return () => {
      active = false;
    };
  }, [churches, loading]);

  // Load pending churches
  useEffect(() => {
    if (!regionId) return;

    const q = query(
      collection(db, "churches"),
      where("regionSelectedId", "==", regionId),
      where("regionStatus", "==", "pending")
    );

    const unsub = onSnapshot(
      q,
      (snap) => { setPendingCount(snap.size); },
      (error) => { if ((error as { code?: string }).code !== 'permission-denied') console.error('pending churches snapshot error:', error); }
    );

    return () => unsub();
  }, [regionId]);

  // Load region details
  useEffect(() => {
    if (!regionId) return;

    const unsub = onSnapshot(
      doc(db, 'regions', regionId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setRegionName(data.name || 'Unknown Region');
          setRegionAdminName(data.regionAdminName || 'Unknown Admin');
          setRegionAdminTitle(data.regionAdminTitle || '');
          setRegionLogoUrl(data.logoUrl ?? null);
        }
      },
      (error) => { if ((error as { code?: string }).code !== 'permission-denied') console.error('region details snapshot error:', error); }
    );

    return () => unsub();
  }, [regionId]);

  // Load regional aggregate metrics
  useEffect(() => {
    if (loading) return;

    const approvedChurches = churches.filter((church) => church.regionStatus === 'approved');

    if (approvedChurches.length === 0) {
      setMemberCount(0);
      setEventCount(0);
      setCheckinCount(0);
      setMusicItemCount(0);
      setSetlistCount(0);
      setMetricsLoading(false);
      return;
    }

    let active = true;

    const loadMetrics = async () => {
      setMetricsLoading(true);

      try {
        const metricsPerChurch = await Promise.all(
          approvedChurches.map(async (church) => {
            const churchId = church.id as string;

            const [eventsSnap, attendanceSnap, musicItemsSnap, setlistsSnap, membersSnap] = await Promise.all([
              getDocs(collection(db, 'churches', churchId, 'events')),
              getDocs(collection(db, 'churches', churchId, 'attendance')),
              getDocs(collection(db, 'churches', churchId, 'songs')),
              getDocs(collection(db, 'churches', churchId, 'setlists')),
              getDocs(query(collection(db, 'churches', churchId, 'members'), where('status', '==', 'Active'))),
            ]);

            const attendanceTotal = attendanceSnap.docs.reduce(
              (total, docSnap) => total + countPresentAttendanceEntries(docSnap.data()),
              0
            );

            return {
              events: eventsSnap.size,
              checkins: attendanceTotal,
              musicItems: musicItemsSnap.size,
              setlists: setlistsSnap.size,
              members: membersSnap.size,
            };
          })
        );

        if (!active) return;

        setMemberCount(metricsPerChurch.reduce((sum, metric) => sum + metric.members, 0));
        setEventCount(metricsPerChurch.reduce((sum, metric) => sum + metric.events, 0));
        setCheckinCount(metricsPerChurch.reduce((sum, metric) => sum + metric.checkins, 0));
        setMusicItemCount(metricsPerChurch.reduce((sum, metric) => sum + metric.musicItems, 0));
        setSetlistCount(metricsPerChurch.reduce((sum, metric) => sum + metric.setlists, 0));
      } catch (error) {
        console.error('Error loading regional dashboard metrics:', error);
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
    };

    loadMetrics();

    return () => {
      active = false;
    };
  }, [churches, loading]);

  const approvedChurches = churches.filter((church) => church.regionStatus === 'approved');
  const adminCount = users.filter((user) => Array.isArray(user.roles) && user.roles.includes('Admin')).length;
  const financeCount = users.filter((user) => Array.isArray(user.roles) && user.roles.includes('Finance')).length;
  const churchLeaderCount = approvedChurches.filter((church) => {
    const hasLeaderName = typeof church.leaderName === 'string' && church.leaderName.trim().length > 0;
    const hasLeaderTitle = typeof church.leaderTitle === 'string' && church.leaderTitle.trim().length > 0;

    return hasLeaderName || hasLeaderTitle;
  }).length;
  const quickActions = [
    { href: '/admin/regional/churches', label: 'View Regional Churches', variant: 'outline' as const },
    { href: '/admin/regional/users', label: 'View Regional Users', variant: 'outline' as const },
    { href: '/admin/reports', label: 'View Reports', variant: 'outline' as const },
  ];

  // Permission check
  if (permLoading) {
    return (
      <div className="p-6 text-muted-foreground">
        Loading…
      </div>
    );
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
    return (
      <div className="p-6 text-muted-foreground">
        Loading regional data…
      </div>
    );
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
        subtitle={regionAdminTitle ? `${regionAdminTitle}: ${regionAdminName || 'Regional Admin'}` : regionAdminName || 'Regional Admin'}
        panelTitle="Region Info"
        panelRows={[
          { label: 'Region ID', value: regionId ? `${regionId.slice(0, 8)}…` : '—' },
          { label: 'Approved Churches', value: String(approvedChurches.length) },
          { label: 'Pending', value: String(pendingCount), highlighted: pendingCount > 0, href: pendingCount > 0 ? '/admin/regional/churches/pending' : undefined },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        
        {/* Active Churches */}
        <DashboardMetricCard title="Churches" value={approvedChurches.length} description="Approved churches in this region" icon={<Building2 className="h-4 w-4 text-emerald-500" />} />

        {/* Members */}
        <DashboardMetricCard title="Members" value={memberCount} description="Active members across region churches" icon={<UserCheck className="h-4 w-4 text-cyan-500" />} />

        {/* Users */}
        <DashboardMetricCard title="Users" value={users.length} description="User accounts tied to region churches" icon={<UserCog className="h-4 w-4 text-blue-500" />} />

        {/* Admins */}
        <DashboardMetricCard title="Admins" value={adminCount} description="User accounts with Admin access" icon={<Shield className="h-4 w-4 text-fuchsia-500" />} />

        {/* Events */}
        <DashboardMetricCard title="Events" value={eventCount} description="Events across region churches" icon={<Calendar className="h-4 w-4 text-sky-500" />} />

        {/* Check-ins */}
        <DashboardMetricCard title="Check-ins" value={checkinCount} description="Attendance entries across region churches" icon={<Activity className="h-4 w-4 text-amber-500" />} />

        {/* Music Items */}
        <DashboardMetricCard title="Music Items" value={musicItemCount} description="Songs across region churches" icon={<Music4 className="h-4 w-4 text-emerald-500" />} />

        {/* Setlists */}
        <DashboardMetricCard title="Setlists" value={setlistCount} description="Setlists across region churches" icon={<ListMusic className="h-4 w-4 text-emerald-500" />} />

        {/* Church Leaders */}
        <DashboardMetricCard title="Church Leaders" value={churchLeaderCount} description="Approved churches with leadership assigned" icon={<Users className="h-4 w-4 text-blue-500" />} />

        {/* Finance Managers */}
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

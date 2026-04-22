//app(dashboard)/admin/regional/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/client';
import { usePermissions } from '@/app/hooks/usePermissions';
import { countPresentAttendanceEntries } from '@/app/lib/attendance-count';
import { getUsersByChurchIds } from '@/app/lib/regional-users';
import Link from 'next/link';
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
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
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
      collection(db, 'regions'),
      (snap) => {
        const regionDoc = snap.docs.find((d) => d.id === regionId);
        if (regionDoc) {
          const data = regionDoc.data();
          setRegionName(data.name || 'Unknown Region');
          setRegionAdminName(data.regionAdminName || 'Unknown Admin');
        }
      },
      (error) => { if ((error as { code?: string }).code !== 'permission-denied') console.error('regions snapshot error:', error); }
    );

    return () => unsub();
  }, [regionId]);

  // Load regional aggregate metrics
  useEffect(() => {
    if (loading) return;

    const approvedChurches = churches.filter((church) => church.regionStatus === 'approved');

    if (approvedChurches.length === 0) {
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

            const [eventsSnap, attendanceSnap, musicItemsSnap, setlistsSnap] = await Promise.all([
              getDocs(collection(db, 'churches', churchId, 'events')),
              getDocs(collection(db, 'churches', churchId, 'attendance')),
              getDocs(collection(db, 'churches', churchId, 'songs')),
              getDocs(collection(db, 'churches', churchId, 'setlists')),
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
            };
          })
        );

        if (!active) return;

        setEventCount(metricsPerChurch.reduce((sum, metric) => sum + metric.events, 0));
        setCheckinCount(metricsPerChurch.reduce((sum, metric) => sum + metric.checkins, 0));
        setMusicItemCount(metricsPerChurch.reduce((sum, metric) => sum + metric.musicItems, 0));
        setSetlistCount(metricsPerChurch.reduce((sum, metric) => sum + metric.setlists, 0));
      } catch (error) {
        console.error('Error loading regional dashboard metrics:', error);
        if (active) {
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Regional Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of churches in your region.
        </p>
      </div>

      {pendingCount > 0 && (
        <div className="p-4 rounded-lg border border-yellow-500 bg-yellow-500/10">
          <h2 className="text-lg font-semibold">Churches Pending Approval</h2>
          <p className="text-xl font-bold mt-1.5">{pendingCount}</p>

          <Link
            href="/admin/regional/churches/pending"
            className="text-sm underline mt-2 inline-block"
          >
            Review Pending Churches
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        
        {/* Region Card */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Region</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <MapPinned className="h-4 w-4 text-blue-500" />
            </div>
          </div>

          <p className="text-xl font-bold mt-1.5">{regionName}</p>

          <p className="text-sm text-muted-foreground mt-1">
            Admin: {regionAdminName}
          </p>

          <p className="text-xs text-muted-foreground mt-1 opacity-60">
            ID: {regionId}
          </p>
        </div>

        {/* Active Churches */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Churches</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <Building2 className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-1.5">{approvedChurches.length}</p>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Approved churches in this region</p>
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
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Users in churches within this region</p>
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
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Church admins in this region</p>
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
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Events across region churches</p>
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
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Attendance entries across region churches</p>
        </div>

        {/* Music Items */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Music Items</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <Music4 className="h-4 w-4 text-gray-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-1.5">{musicItemCount}</p>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Songs across region churches</p>
        </div>

        {/* Setlists */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Setlists</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <ListMusic className="h-4 w-4 text-gray-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-1.5">{setlistCount}</p>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Setlists across region churches</p>
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
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Users with Finance role in region churches</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

        <div className="flex flex-col gap-3">
          <Link
            href="/admin/regional/churches"
            className="px-4 py-2 rounded-md border bg-muted/20 hover:bg-muted transition"
          >
            View Regional Churches
          </Link>
          <Link
            href="/admin/regional/users"
            className="px-4 py-2 rounded-md border bg-muted/20 hover:bg-muted transition"
          >
            View Regional Users
          </Link>
        </div>
      </div>
    </div>
  );
}

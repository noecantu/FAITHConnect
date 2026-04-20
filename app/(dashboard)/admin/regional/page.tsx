//app(dashboard)/admin/regional/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/client';
import { usePermissions } from '@/app/hooks/usePermissions';
import Link from 'next/link';
import { Activity, Building2, Calendar, Church, MapPinned } from 'lucide-react';

export default function RegionalDashboardPage() {
  const { isRegionalAdmin, regionId, loading: permLoading } = usePermissions();

  const [churches, setChurches] = useState<any[]>([]);
  const [regionName, setRegionName] = useState('');
  const [regionAdminName, setRegionAdminName] = useState('');
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [upcomingServicesCount, setUpcomingServicesCount] = useState(0);
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);
  const [generalAttendanceCount, setGeneralAttendanceCount] = useState(0);

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
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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

    if (churches.length === 0) {
      setUpcomingServicesCount(0);
      setUpcomingEventsCount(0);
      setGeneralAttendanceCount(0);
      setMetricsLoading(false);
      return;
    }

    let active = true;

    const loadMetrics = async () => {
      setMetricsLoading(true);

      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() + diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const todayIso = startOfToday.toISOString().slice(0, 10);
      const startIso = startOfWeek.toISOString().slice(0, 10);
      const endIso = endOfWeek.toISOString().slice(0, 10);

      try {
        const metricsPerChurch = await Promise.all(
          churches.map(async (church) => {
            const churchId = church.id as string;

            const servicesQuery = query(
              collection(db, 'churches', churchId, 'servicePlans'),
              where('dateString', '>=', todayIso)
            );

            const eventsQuery = query(
              collection(db, 'churches', churchId, 'events'),
              where('date', '>=', startOfToday)
            );

            const attendanceQuery = query(
              collection(db, 'churches', churchId, 'attendance'),
              where('__name__', '>=', startIso),
              where('__name__', '<=', endIso)
            );

            const [servicesSnap, eventsSnap, attendanceSnap] = await Promise.all([
              getDocs(servicesQuery),
              getDocs(eventsQuery),
              getDocs(attendanceQuery),
            ]);

            let attendanceTotal = 0;

            attendanceSnap.forEach((docSnap) => {
              const data = docSnap.data();

              const recordCount =
                data.records && typeof data.records === 'object'
                  ? Object.keys(data.records).filter((id) => data.records[id] === true).length
                  : 0;

              let visitorCount = 0;

              if (typeof data.visitors === 'number') {
                visitorCount = data.visitors;
              } else if (
                data.visitors &&
                typeof data.visitors === 'object' &&
                !Array.isArray(data.visitors)
              ) {
                visitorCount = Object.keys(data.visitors).length;
              }

              attendanceTotal += recordCount + visitorCount;
            });

            return {
              services: servicesSnap.size,
              events: eventsSnap.size,
              attendance: attendanceTotal,
            };
          })
        );

        if (!active) return;

        setUpcomingServicesCount(metricsPerChurch.reduce((sum, m) => sum + m.services, 0));
        setUpcomingEventsCount(metricsPerChurch.reduce((sum, m) => sum + m.events, 0));
        setGeneralAttendanceCount(metricsPerChurch.reduce((sum, m) => sum + m.attendance, 0));
      } catch (error) {
        console.error('Error loading regional dashboard metrics:', error);
        if (active) {
          setUpcomingServicesCount(0);
          setUpcomingEventsCount(0);
          setGeneralAttendanceCount(0);
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

  if (loading || metricsLoading) {
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
          <p className="text-xl font-bold mt-2">{pendingCount}</p>

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
              <MapPinned className="h-4 w-4 text-blue-300" />
            </div>
          </div>

          <p className="text-xl font-bold mt-2">{regionName}</p>

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
            <h2 className="text-lg font-semibold">Active Churches</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <Building2 className="h-4 w-4 text-emerald-300" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-2">
            {churches.filter((c) => c.regionStatus === "approved").length}
          </p>
        </div>

        {/* Upcoming Services */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Upcoming Services</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <Church className="h-4 w-4 text-violet-300" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-2">{upcomingServicesCount}</p>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">All supervised churches</p>
        </div>

        {/* Upcoming Events */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">Upcoming Events</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <Calendar className="h-4 w-4 text-sky-300" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-2">{upcomingEventsCount}</p>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">All supervised churches</p>
        </div>

        {/* General Attendance */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">General Attendance</h2>
            <div className="rounded-md border border-white/20 bg-white/5 p-2">
              <Activity className="h-4 w-4 text-amber-300" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-2">{generalAttendanceCount}</p>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">Current week count</p>
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
        </div>
      </div>
    </div>
  );
}

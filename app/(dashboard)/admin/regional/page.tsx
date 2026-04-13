'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/client';
import { usePermissions } from '@/app/hooks/usePermissions';
import Link from 'next/link';

export default function RegionalDashboardPage() {
  const { isRootAdmin, isRegionalAdmin, regionId } = usePermissions();
  const [pendingCount, setPendingCount] = useState(0);
  const [churchCount, setChurchCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [regionName, setRegionName] = useState('');
  const [regionAdminName, setregionAdminName] = useState('');
  const [loading, setLoading] = useState(true);

  // Load churches in region
  useEffect(() => {
    if (!regionId) return;

    const q = query(
      collection(db, 'churches'),
      where('regionId', '==', regionId)
    );

    const unsub = onSnapshot(q, (snap) => {
      setChurchCount(snap.size);
    });

    return () => unsub();
  }, [regionId]);

  // Load users in region
  useEffect(() => {
    if (!regionId) return;

    const q = query(
      collection(db, 'users'),
      where('regionId', '==', regionId)
    );

    const unsub = onSnapshot(q, (snap) => {
      setUserCount(snap.size);
      setLoading(false);
    });

    return () => unsub();
  }, [regionId]);

  // Load region details (name + admin)
  useEffect(() => {
    if (!regionId) return;

    const unsub = onSnapshot(doc(db, 'regions', regionId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRegionName(data.name || 'Unknown Region');
        setregionAdminName(data.regionAdminName || 'Unknown Admin');
      }
    });

    return () => unsub();
  }, [regionId]);

  useEffect(() => {
    if (!regionId) return;

    const q = query(
      collection(db, "churches"),
      where("regionId", "==", regionId),
      where("regionStatus", "==", "pending")
    );

    const unsub = onSnapshot(q, (snap) => {
      setPendingCount(snap.size);
    });

    return () => unsub();
  }, [regionId]);

  if (!isRegionalAdmin && !isRootAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Regional Dashboard</h1>
        <p className="text-muted-foreground">Loading regional data…</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl animate-pulse"
            >
              <div className="h-5 w-32 bg-white/10 rounded mb-4" />
              <div className="h-10 w-20 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Regional Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of churches and users in your region.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <h2 className="text-lg font-semibold">Churches</h2>
          <p className="text-3xl font-bold mt-2">{churchCount}</p>
          <Link
            href="/admin/regional/churches"
            className="text-sm text-primary hover:underline mt-2 inline-block"
          >
            View Churches →
          </Link>
        </div>

        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-3xl font-bold mt-2">{userCount}</p>
          <Link
            href="/admin/regional/users"
            className="text-sm text-primary hover:underline mt-2 inline-block"
          >
            View Users →
          </Link>
        </div>

        {/* Updated Region Card */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <h2 className="text-lg font-semibold">Region</h2>

          <p className="text-xl font-bold mt-2">{regionName}</p>

          <p className="text-sm text-muted-foreground mt-1">
            Admin: {regionAdminName}
          </p>

          <p className="text-xs text-muted-foreground mt-1 opacity-60">
            ID: {regionId}
          </p>
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
            Manage Regional Churches
          </Link>

          <Link
            href="/admin/regional/users"
            className="px-4 py-2 rounded-md border bg-muted/20 hover:bg-muted transition"
          >
            Manage Regional Users
          </Link>
        </div>
      </div>
      {pendingCount > 0 && (
        <div className="p-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10">
          <p className="text-yellow-300 font-semibold">
            {pendingCount} church{pendingCount > 1 ? "es" : ""} awaiting approval
          </p>
          <Link
            href="/admin/regional/churches/pending"
            className="text-sm text-primary hover:underline"
          >
            Review Now →
          </Link>
        </div>
      )}
    </div>
  );
}
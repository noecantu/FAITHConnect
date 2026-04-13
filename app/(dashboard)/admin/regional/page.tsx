'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/client';
import { usePermissions } from '@/app/hooks/usePermissions';
import Link from 'next/link';

export default function RegionalDashboardPage() {
  const { isRegionalAdmin, regionId } = usePermissions();

  const [churches, setChurches] = useState<any[]>([]);
  const [churchAdmins, setChurchAdmins] = useState<any[]>([]);
  const [regionName, setRegionName] = useState('');
  const [regionAdminName, setRegionAdminName] = useState('');
  const [loading, setLoading] = useState(true);

  // Load churches in region
  useEffect(() => {
    if (!regionId) return;

    const q = query(
      collection(db, 'churches'),
      where('regionId', '==', regionId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setChurches(list);
      setLoading(false);
    });

    return () => unsub();
  }, [regionId]);

  // Load region details
  useEffect(() => {
    if (!regionId) return;

    const unsub = onSnapshot(collection(db, 'regions'), (snap) => {
      const regionDoc = snap.docs.find((d) => d.id === regionId);
      if (regionDoc) {
        const data = regionDoc.data();
        setRegionName(data.name || 'Unknown Region');
        setRegionAdminName(data.regionAdminName || 'Unknown Admin');
      }
    });

    return () => unsub();
  }, [regionId]);

  // Load church admins in region
  useEffect(() => {
    if (churches.length === 0) {
      setChurchAdmins([]);
      return;
    }

    const batches: string[][] = [];
    for (let i = 0; i < churches.length; i += 10) {
      batches.push(churches.slice(i, i + 10).map((c) => c.id));
    }

    const unsubs: (() => void)[] = [];

    batches.forEach((batch) => {
      const q = query(
        collection(db, "users"),
        where("churchId", "in", batch),
        where("role", "==", "church-admin")
      );

      const unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setChurchAdmins((prev) => {
          const merged = [...prev, ...list];
          return Array.from(new Map(merged.map((u) => [u.id, u])).values());
        });
      });

      unsubs.push(unsub);
    });

    return () => unsubs.forEach((fn) => fn());
  }, [churches]);

  // Permission check
  if (!isRegionalAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Region Card */}
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

        {/* Active Churches */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <h2 className="text-lg font-semibold">Active Churches</h2>
          <p className="text-3xl font-bold mt-2">
            {churches.filter((c) => c.status !== 'disabled').length}
          </p>
        </div>

        {/* Church Admin Count */}
        <div className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl">
          <h2 className="text-lg font-semibold">Church Admins</h2>
          <p className="text-3xl font-bold mt-2">{churchAdmins.length}</p>
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

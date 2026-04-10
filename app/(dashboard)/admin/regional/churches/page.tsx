'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { useAuth } from '@/app/hooks/useAuth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/client';
import Link from 'next/link';

export default function RegionalChurchesPage() {
  const { user } = useAuth();
  const [churches, setChurches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not regional admin
  if (user && !user.roles.includes('RegionalAdmin')) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  useEffect(() => {
    if (!user?.regionId) return;

    const q = query(
      collection(db, 'churches'),
      where('regionId', '==', user.regionId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setChurches(list);
      setLoading(false);
    });

    return () => unsub();
  }, [user?.regionId]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Regional Churches"
        subtitle="Churches assigned to your region."
      />

      {loading && (
        <div className="text-muted-foreground">Loading churches…</div>
      )}

      {!loading && churches.length === 0 && (
        <div className="text-muted-foreground">
          No churches are assigned to your region yet.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {churches.map((church) => (
          <div
            key={church.id}
            className="p-4 rounded-lg border border-white/10 bg-black/40 backdrop-blur-xl"
          >
            <h2 className="text-lg font-semibold">{church.name}</h2>

            <p className="text-sm text-muted-foreground mt-1">
              {church.address || 'No address'}
            </p>

            <p className="text-sm text-muted-foreground">
              {church.phone || 'No phone'}
            </p>

            <div className="flex justify-end mt-4">
              <Link
                href={`/regional/church/${church.id}`}
                className="
                  px-3 py-1.5 rounded-md border
                  bg-muted/20 hover:bg-muted transition
                  text-sm
                "
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

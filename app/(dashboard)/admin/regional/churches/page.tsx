'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { usePermissions } from '@/app/hooks/usePermissions';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/client';
import Link from 'next/link';

export default function RegionalChurchesPage() {
  const { isRegionalAdmin, regionId, loading: permLoading } = usePermissions();

  const [churches, setChurches] = useState<any[]>([]);
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

  if (!permLoading && !isRegionalAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {churches.map((church) => (
          <div
            key={church.id}
            className="
              p-5 rounded-xl border border-white/10 
              bg-black/40 backdrop-blur-xl 
              shadow-lg hover:shadow-xl 
              transition-all duration-200 
              hover:-translate-y-1
              space-y-3
            "
          >
            {/* Logo */}
            {church.logoUrl && (
              <div className="flex justify-center">
                <img
                  src={church.logoUrl}
                  alt={`${church.name} logo`}
                  className="
                    rounded-md object-cover 
                    border border-white/20 bg-white 
                    shadow-md
                  "
                />
              </div>
            )}

            <h2 className="text-lg font-semibold text-center">{church.name}</h2>

            <p className="text-sm text-muted-foreground text-center">
              {church.address || 'No address'}
            </p>

            <p className="text-sm text-muted-foreground text-center">
              {church.phone || 'No phone'}
            </p>

            <div className="flex justify-center pt-2">
              <Link
                href={`/admin/regional/church/${church.id}`}
                className="
                  px-4 py-2 rounded-md border
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

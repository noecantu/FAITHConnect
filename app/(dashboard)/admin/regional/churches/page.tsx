'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { usePermissions } from '@/app/hooks/usePermissions';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/client';
import Link from 'next/link';
import { formatPhone } from '@/app/lib/formatters';

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

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setChurches(list);
        setLoading(false);
      },
      (error) => {
        if ((error as { code?: string }).code !== 'permission-denied') console.error('regional churches list snapshot error:', error);
        setLoading(false);
      }
    );

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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {churches.map((church) => (
          <Link
            key={church.id}
            href={`/admin/regional/church/${church.id}`}
            className="group block"
          >
            <div
              className="
                h-full p-5 rounded-xl
                bg-black/40 backdrop-blur-xl
                shadow-lg
                interactive-card
              "
            >
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
                {/* Logo */}
                <div className="flex-shrink-0">
                  {church.logoUrl ? (
                    <img
                      src={church.logoUrl}
                      alt={`${church.name} logo`}
                      className="
                        h-32 w-32 rounded-md object-cover 
                        interactive-card-media bg-white shadow-md
                      "
                    />
                  ) : (
                    <div
                      className="
                        h-20 w-20 rounded-md flex items-center justify-center 
                        bg-white/10 interactive-card-media text-xl font-semibold
                      "
                    >
                      {church.name?.[0]?.toUpperCase() ?? "C"}
                    </div>
                  )}
                </div>

                {/* Church Info */}
                <div className="flex min-w-0 flex-col space-y-1">
                  <h2 className="text-lg font-semibold truncate">{church.name}</h2>

                  {(church.leaderTitle || church.leaderName) && (
                    <p className="text-sm text-muted-foreground truncate">
                      {church.leaderTitle ? church.leaderTitle + " " : ""}
                      {church.leaderName ?? ""}
                    </p>
                  )}

                  {church.address && (
                    <p className="text-sm text-muted-foreground truncate">{church.address}</p>
                  )}

                  {(church.city || church.state || church.zip) && (
                    <p className="text-sm text-muted-foreground truncate">
                      {[church.city, church.state].filter(Boolean).join(", ")}
                      {church.zip ? ` ${church.zip}` : ""}
                    </p>
                  )}

                  {church.phone && (
                    <p className="text-sm text-muted-foreground truncate">
                      {formatPhone(church.phone)}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground truncate">
                    Timezone: {church.timezone}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

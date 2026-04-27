'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { usePermissions } from '@/app/hooks/usePermissions';
import { getSupabaseClient } from "@/app/lib/supabase/client";
import Link from 'next/link';
import { formatPhone } from '@/app/lib/formatters';

export default function RegionalChurchesPage() {
  const { isRegionalAdmin, region_id, loading: permLoading } = usePermissions();

  const [churches, setChurches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!region_id) return;
    let active = true;

    getSupabaseClient()
      .from('churches')
      .select('*')
      .eq('region_id', region_id)
      .then(({ data }) => {
        if (!active) return;
        setChurches(data ?? []);
        setLoading(false);
      });

    return () => { active = false; };
  }, [region_id]);

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
                  {church.logo_url ? (
                    <img
                      src={church.logo_url}
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

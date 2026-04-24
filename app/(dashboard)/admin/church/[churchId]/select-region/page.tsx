'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/client';
import { Card } from '@/app/components/ui/card';

export default function SelectRegionPage() {
  const { churchId } = useParams();
  const router = useRouter();

  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, 'regions'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRegions(list);
      setLoading(false);
    }
    load();
  }, []);

  // Group by state (still useful for organization)
  const grouped = regions.reduce((acc: any, region: any) => {
    const state = region.state || 'Unknown';
    if (!acc[state]) acc[state] = [];
    acc[state].push(region);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="p-6 text-muted-foreground">
        Loading Regions…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Select a Region</h1>
        <p className="text-muted-foreground">
          Choose the region your church belongs to.
        </p>
      </div>

      {/* State Sections */}
      {Object.keys(grouped).map((state) => (
        <div key={state} className="space-y-4">
          {/* State Header */}
          <h2 className="text-xl font-semibold">{state}</h2>

          {/* Region Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {grouped[state].map((region: any) => (
              <Card
                key={region.id}
                className="
                  p-4 bg-black/40 backdrop-blur-xl
                  hover:bg-black/60 cursor-pointer interactive-card interactive-card-focus
                "
                onClick={() =>
                  router.push(
                    `/admin/church/${churchId}/select-region/${region.id}`
                  )
                }
              >
                <div className="flex items-center gap-4">
                  {region.logoUrl ? (
                    <img
                      src={region.logoUrl}
                      alt={`${region.name} logo`}
                      className="h-16 w-16 shrink-0 rounded-md object-cover border border-white/20"
                    />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground border border-white/20">
                      {String(region.name || "RG")
                        .split(" ")
                        .map((word) => word[0]?.toUpperCase())
                        .join("")
                        .slice(0, 2)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-lg font-semibold truncate">{region.name}</p>

                    {/* Title + Admin Name */}
                    {region.regionAdminTitle && region.regionAdminName && (
                      <p className="text-sm text-muted-foreground truncate">
                        {region.regionAdminTitle}: {region.regionAdminName}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
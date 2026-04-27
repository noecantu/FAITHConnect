'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { Card } from '@/app/components/ui/card';
import { PageHeader } from '@/app/components/page-header';
import { Building2, MapPinned, ChevronRight } from 'lucide-react';

type Region = {
  id: string;
  name: string;
  state?: string | null;
  logo_url?: string | null;
  region_admin_name?: string | null;
  region_admin_title?: string | null;
  district_id?: string | null;
  district_name?: string | null;
  church_count?: number;
};

export default function SelectRegionPage() {
  const supabase = getSupabaseClient();
  const { churchId } = useParams();
  const router = useRouter();

  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('regions')
        .select('id, name, state, logo_url, region_admin_name, region_admin_title, district_id')
        .order('state', { ascending: true })
        .order('name', { ascending: true });

      if (error) console.error('SelectRegionPage load error:', error);

      const regionList: Region[] = data ?? [];

      // Enrich with district names
      const districtIds = [...new Set(regionList.map((r) => r.district_id).filter(Boolean))] as string[];
      let districtNameById = new Map<string, string>();
      if (districtIds.length > 0) {
        const { data: districts } = await supabase
          .from('districts')
          .select('id, name')
          .in('id', districtIds);
        districtNameById = new Map((districts ?? []).map((d) => [d.id, d.name]));
      }

      // Enrich with approved church counts
      const enriched = await Promise.all(
        regionList.map(async (region) => {
          const { count } = await supabase
            .from('churches')
            .select('id', { count: 'exact', head: true })
            .eq('region_id', region.id)
            .eq('region_status', 'approved');
          return {
            ...region,
            district_name: region.district_id ? (districtNameById.get(region.district_id) ?? null) : null,
            church_count: count ?? 0,
          };
        })
      );

      setRegions(enriched);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group by state
  const grouped = regions.reduce<Record<string, Region[]>>((acc, region) => {
    const state = region.state || 'Unknown';
    if (!acc[state]) acc[state] = [];
    acc[state].push(region);
    return acc;
  }, {});

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading Regions…</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Select a Region"
        subtitle="Choose the region your church belongs to. Your request will be sent to the regional administrator for approval."
      />

      {/* Info banner */}
      <div className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-white">How it works</p>
        <p>After you select a region, the regional administrator will review and approve your request. Until approved, your church will show as <span className="text-amber-400 font-medium">Pending</span>. You can change your selection at any time before approval.</p>
      </div>

      {/* State Sections */}
      {Object.keys(grouped).sort().map((state) => (
        <div key={state} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <MapPinned className="h-3.5 w-3.5" />{state}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {grouped[state].map((region) => (
              <Card
                key={region.id}
                className="p-4 bg-black/40 backdrop-blur-xl hover:bg-black/60 cursor-pointer interactive-card interactive-card-focus"
                onClick={() => router.push(`/admin/church/${churchId}/select-region/${region.id}`)}
              >
                <div className="flex items-center gap-4">
                  {/* Logo / Initials */}
                  {region.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={region.logo_url}
                      alt={`${region.name} logo`}
                      className="h-16 w-16 shrink-0 rounded-md object-cover border border-white/20"
                    />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-md bg-muted flex items-center justify-center text-lg font-semibold border border-white/20">
                      {String(region.name || 'RG')
                        .split(' ')
                        .map((w) => w[0]?.toUpperCase())
                        .join('')
                        .slice(0, 2)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-base font-semibold truncate">{region.name}</p>

                    {(region.region_admin_title || region.region_admin_name) && (
                      <p className="text-sm text-muted-foreground truncate">
                        {region.region_admin_title ? `${region.region_admin_title}: ` : ''}
                        {region.region_admin_name ?? ''}
                      </p>
                    )}

                    <div className="flex items-center gap-3 pt-1">
                      {region.district_name && (
                        <span className="text-xs text-muted-foreground">
                          District: {region.district_name}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {region.church_count ?? 0} {region.church_count === 1 ? 'church' : 'churches'}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
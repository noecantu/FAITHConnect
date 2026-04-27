//app/(dashboard)/admin/district/regions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { usePermissions } from "@/app/hooks/usePermissions";
import { PageHeader } from "@/app/components/page-header";
import { Card, CardContent } from "@/app/components/ui/card";
import { Building2 } from "lucide-react";
import Link from "next/link";

type DistrictRegion = {
  id: string;
  name: string;
  logoUrl?: string | null;
  regionAdminName?: string | null;
  regionAdminTitle?: string | null;
  state?: string | null;
  churchCount?: number;
};

export default function DistrictRegionsPage() {
  const { isDistrictAdmin, districtId, loading: permLoading } = usePermissions();

  const [regions, setRegions] = useState<DistrictRegion[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load approved regions in this district
  useEffect(() => {
    if (!districtId) return;
    let active = true;

    const supabase = getSupabaseClient();

    supabase
      .from("regions")
      .select("id, name, logo_url, region_admin_name, region_admin_title, state")
      .eq("district_id", districtId)
      .then(async ({ data }) => {
        if (!active) return;

        const regionList = (data ?? []).map((d) => ({
          id: d.id,
          name: d.name || "Unknown Region",
          logoUrl: d.logo_url ?? null,
          regionAdminName: d.region_admin_name ?? null,
          regionAdminTitle: d.region_admin_title ?? null,
          state: d.state ?? null,
        }));

        const enriched = await Promise.all(
          regionList.map(async (region) => {
            try {
              const { count } = await supabase
                .from("churches")
                .select("id", { count: "exact", head: true })
                .eq("region_id", region.id);
              return { ...region, churchCount: count ?? 0 };
            } catch {
              return { ...region, churchCount: 0 };
            }
          })
        );

        if (active) {
          setRegions(enriched);
          setLoading(false);
        }
      });

    return () => { active = false; };
  }, [districtId]);

  // Load pending count
  useEffect(() => {
    if (!districtId) return;
    let active = true;

    getSupabaseClient()
      .from("regions")
      .select("id", { count: "exact", head: true })
      .eq("district_selected_id", districtId)
      .eq("district_status", "pending")
      .then(({ count }) => {
        if (active) setPendingCount(count ?? 0);
      });

    return () => { active = false; };
  }, [districtId]);

  if (permLoading) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  if (!isDistrictAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading regions…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="My Regions"
        subtitle="All approved regions under your district oversight."
      />

      {pendingCount > 0 && (
        <div className="p-4 rounded-lg border border-yellow-500 bg-yellow-500/10">
          <h2 className="text-lg font-semibold">Regions Pending Approval</h2>
          <p className="text-xl font-bold mt-1.5">{pendingCount}</p>
          <Link href="/admin/district/regions/pending" className="text-sm underline mt-2 inline-block">
            Review Pending Regions
          </Link>
        </div>
      )}

      {regions.length === 0 ? (
        <p className="text-muted-foreground text-sm">No regions assigned to your district yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {regions.map((region) => (
            <Card key={region.id}>
              <CardContent className="pt-5 space-y-2">
                <div className="flex items-center gap-3">
                  {region.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={region.logoUrl}
                      alt={`${region.name} logo`}
                      className="h-10 w-10 rounded-md object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                      {region.name.split(" ").map((w) => w[0]?.toUpperCase()).join("").slice(0, 2) || "R"}
                    </div>
                  )}
                  <span className="font-semibold">{region.name}</span>
                </div>
                {region.state && (
                  <p className="text-sm text-muted-foreground">{region.state}</p>
                )}
                {region.regionAdminName && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Admin:</span>{" "}
                    {region.regionAdminTitle
                      ? `${region.regionAdminTitle} ${region.regionAdminName}`
                      : region.regionAdminName}
                  </p>
                )}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span>{region.churchCount ?? 0} churches</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

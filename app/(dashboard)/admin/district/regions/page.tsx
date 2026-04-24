//app/(dashboard)/admin/district/regions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { usePermissions } from "@/app/hooks/usePermissions";
import { PageHeader } from "@/app/components/page-header";
import { Card, CardContent } from "@/app/components/ui/card";
import { Building2, MapPinned } from "lucide-react";
import Link from "next/link";

type DistrictRegion = {
  id: string;
  name: string;
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

    const q = query(
      collection(db, "regions"),
      where("districtId", "==", districtId)
    );

    const unsub = onSnapshot(
      q,
      async (snap) => {
        const regionList = snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name || "Unknown Region",
          regionAdminName: d.data().regionAdminName ?? null,
          regionAdminTitle: d.data().regionAdminTitle ?? null,
          state: d.data().state ?? null,
        }));

        const enriched = await Promise.all(
          regionList.map(async (region) => {
            try {
              const churchSnap = await getDocs(
                query(collection(db, "churches"), where("regionId", "==", region.id))
              );
              return { ...region, churchCount: churchSnap.size };
            } catch {
              return { ...region, churchCount: 0 };
            }
          })
        );

        setRegions(enriched);
        setLoading(false);
      },
      (error) => {
        if ((error as { code?: string }).code !== "permission-denied") {
          console.error("district regions snapshot error:", error);
        }
        setLoading(false);
      }
    );

    return () => unsub();
  }, [districtId]);

  // Load pending count
  useEffect(() => {
    if (!districtId) return;

    const q = query(
      collection(db, "regions"),
      where("districtSelectedId", "==", districtId),
      where("districtStatus", "==", "pending")
    );

    const unsub = onSnapshot(
      q,
      (snap) => setPendingCount(snap.size),
      (error) => { if ((error as { code?: string }).code !== "permission-denied") console.error("pending regions count error:", error); }
    );

    return () => unsub();
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
                <div className="flex items-center gap-2">
                  <MapPinned className="h-4 w-4 text-muted-foreground" />
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

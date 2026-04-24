//app/(dashboard)/admin/regional/select-district/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { usePermissions } from "@/app/hooks/usePermissions";
import { PageHeader } from "@/app/components/page-header";
import { Input } from "@/app/components/ui/input";
import { Card } from "@/app/components/ui/card";
import Link from "next/link";

type District = {
  id: string;
  name: string;
  logoUrl?: string | null;
  regionAdminName?: string | null;
  regionAdminTitle?: string | null;
  state?: string | null;
};

export default function SelectDistrictPage() {
  const { isRegionalAdmin, regionId, loading: permLoading } = usePermissions();

  const [districts, setDistricts] = useState<District[]>([]);
  const [search, setSearch] = useState("");
  const [currentDistrictStatus, setCurrentDistrictStatus] = useState<string | null>(null);
  const [currentDistrictName, setCurrentDistrictName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load all districts
  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, "districts"));
        setDistricts(
          snap.docs.map((d) => ({
            id: d.id,
            name: d.data().name || "Unknown District",
            logoUrl: d.data().logoUrl ?? null,
            regionAdminName: d.data().regionAdminName ?? null,
            regionAdminTitle: d.data().regionAdminTitle ?? null,
            state: d.data().state ?? null,
          }))
        );
      } catch (err) {
        console.error("Error loading districts:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load current region's district status
  useEffect(() => {
    if (!regionId) return;

    async function loadRegion() {
      try {
        const snap = await getDoc(doc(db, "regions", regionId!));
        if (snap.exists()) {
          const data = snap.data();
          setCurrentDistrictStatus(data.districtStatus ?? null);

          if (data.districtId || data.districtSelectedId) {
            const did = data.districtId || data.districtSelectedId;
            const dSnap = await getDoc(doc(db, "districts", did));
            if (dSnap.exists()) setCurrentDistrictName(dSnap.data().name || null);
          }
        }
      } catch (err) {
        console.error("Error loading region district status:", err);
      }
    }

    loadRegion();
  }, [regionId]);

  const filtered = districts.filter((d) => {
    const term = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(term) ||
      (d.regionAdminName ?? "").toLowerCase().includes(term) ||
      (d.state ?? "").toLowerCase().includes(term)
    );
  });

  if (permLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;

  if (!isRegionalAdmin) {
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
        title="Select a District"
        subtitle="Request to join a district. Your request will be sent to the District Admin for approval."
      />

      {/* Current Status */}
      {currentDistrictStatus === "approved" && currentDistrictName && (
        <div className="p-4 rounded-lg border border-emerald-500 bg-emerald-500/10">
          <p className="font-semibold">Your region is part of: {currentDistrictName}</p>
          <p className="text-sm text-muted-foreground mt-1">Your district membership is approved.</p>
        </div>
      )}

      {currentDistrictStatus === "pending" && currentDistrictName && (
        <div className="p-4 rounded-lg border border-yellow-500 bg-yellow-500/10">
          <p className="font-semibold">Pending approval for: {currentDistrictName}</p>
          <p className="text-sm text-muted-foreground mt-1">Your request is awaiting the District Admin&apos;s approval.</p>
        </div>
      )}

      {currentDistrictStatus === "rejected" && (
        <div className="p-4 rounded-lg border border-red-500 bg-red-500/10">
          <p className="font-semibold">Your last request was rejected.</p>
          <p className="text-sm text-muted-foreground mt-1">You may select a different district or re-request.</p>
        </div>
      )}

      <div>
        <Input
          placeholder="Search by name, admin, or state…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm mb-4"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading districts…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No districts found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((district) => (
            <Link
              key={district.id}
              href={`/admin/regional/select-district/${district.id}`}
              className="block"
            >
              <Card
                className="
                  p-4 bg-black/40 backdrop-blur-xl
                  hover:bg-black/60 cursor-pointer interactive-card interactive-card-focus
                "
              >
                <div className="flex items-center gap-4">
                  {district.logoUrl ? (
                    <img
                      src={district.logoUrl}
                      alt={`${district.name} logo`}
                      className="h-16 w-16 shrink-0 rounded-md object-cover border border-white/20"
                    />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground border border-white/20">
                      {district.name
                        .split(" ")
                        .map((word) => word[0]?.toUpperCase())
                        .join("")
                        .slice(0, 2)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-lg font-semibold truncate">{district.name}</p>

                    {district.regionAdminTitle && district.regionAdminName && (
                      <p className="text-sm text-muted-foreground truncate">
                        {district.regionAdminTitle}: {district.regionAdminName}
                      </p>
                    )}

                    {district.state && (
                      <p className="text-sm text-muted-foreground">{district.state}</p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

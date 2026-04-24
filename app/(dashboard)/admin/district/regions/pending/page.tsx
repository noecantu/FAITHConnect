//app/(dashboard)/admin/district/regions/pending/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { usePermissions } from "@/app/hooks/usePermissions";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/hooks/use-toast";
import { PageHeader } from "@/app/components/page-header";

export default function PendingRegionsPage() {
  const { districtId, isDistrictAdmin, loading: permLoading } = usePermissions();
  const { toast } = useToast();

  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!districtId) return;

    const q = query(
      collection(db, "regions"),
      where("districtSelectedId", "==", districtId),
      where("districtStatus", "==", "pending")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setPending(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        if ((error as { code?: string }).code !== "permission-denied") {
          console.error("pending regions snapshot error:", error);
        }
        setLoading(false);
      }
    );

    return () => unsub();
  }, [districtId]);

  async function handleApprove(regionId: string) {
    const res = await fetch("/api/district-approval/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regionId }),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast({
        title: "Error",
        description: data.error ?? "Could not approve region.",
      });
      return;
    }

    toast({
      title: "Region Approved",
      description: "This region is now officially part of your district.",
    });
  }

  async function handleReject(regionId: string) {
    await updateDoc(doc(db, "regions", regionId), {
      districtStatus: "rejected",
      updatedAt: new Date(),
    });

    toast({
      title: "Region Rejected",
      description: "The region request has been rejected.",
    });
  }

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
    return <div className="p-6 text-muted-foreground">Loading Pending Regions…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Pending Region Approvals"
        subtitle="These regions have requested to join your district and are awaiting your approval."
      />

      {pending.length === 0 && (
        <p className="text-muted-foreground">No pending region requests.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pending.map((region) => (
          <Card
            key={region.id}
            className="p-4 bg-black/60 border-white/20 backdrop-blur-xl space-y-3"
          >
            <p className="text-lg font-semibold">{region.name}</p>

            {(region.regionAdminTitle || region.regionAdminName) && (
              <p className="text-sm text-muted-foreground">
                {region.regionAdminTitle ? `${region.regionAdminTitle} ` : ""}
                {region.regionAdminName ?? ""}
              </p>
            )}

            {region.state && (
              <p className="text-sm text-muted-foreground">{region.state}</p>
            )}

            <div className="flex gap-3">
              <Button
                className="bg-green-600 text-white"
                onClick={() => handleApprove(region.id)}
              >
                Approve
              </Button>

              <Button
                className="bg-red-600 text-white"
                onClick={() => handleReject(region.id)}
              >
                Reject
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

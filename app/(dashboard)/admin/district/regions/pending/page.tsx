//app/(dashboard)/admin/district/regions/pending/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { usePermissions } from "@/app/hooks/usePermissions";
import { useToast } from "@/app/hooks/use-toast";
import { PageHeader } from "@/app/components/page-header";
import { DashboardApprovalRequestCard } from "../../../../../components/ui/dashboard-cards";

export default function PendingRegionsPage() {
  const { districtId, isDistrictAdmin, loading: permLoading } = usePermissions();
  const { toast } = useToast();

  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!districtId) return;

    let active = true;

    getSupabaseClient()
      .from("regions")
      .select("*")
      .eq("district_selected_id", districtId)
      .eq("district_status", "pending")
      .then(({ data }) => {
        if (!active) return;
        setPending((data ?? []).map((d) => ({ id: d.id, ...d })));
        setLoading(false);
      });

    return () => { active = false; };
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
    await getSupabaseClient()
      .from("regions")
      .update({ district_status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", regionId);

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
          <DashboardApprovalRequestCard
            key={region.id}
            name={region.name || "Unknown Region"}
            logoUrl={region.logoUrl ?? null}
            logoAlt={`${region.name || "Region"} logo`}
            fallback={String(region.name || "RG")
              .split(' ')
              .map((word) => word[0]?.toUpperCase())
              .join('')
              .slice(0, 2)}
            subtitle={region.regionAdminTitle || region.regionAdminName
              ? `${region.regionAdminTitle ? `${region.regionAdminTitle} ` : ''}${region.regionAdminName ?? ''}`
              : null}
            meta={region.state ?? null}
            onApprove={() => handleApprove(region.id)}
            onReject={() => handleReject(region.id)}
          />
        ))}
      </div>
    </div>
  );
}

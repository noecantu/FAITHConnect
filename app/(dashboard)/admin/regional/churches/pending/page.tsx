'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { usePermissions } from '@/app/hooks/usePermissions';
import { useToast } from '@/app/hooks/use-toast';
import { PageHeader } from '@/app/components/page-header';
import { DashboardApprovalRequestCard } from '@/app/components/ui/dashboard-cards';

export default function PendingChurchesPage() {
  const supabase = getSupabaseClient();
  const { regionId, isRegionalAdmin, loading: permLoading } = usePermissions();
  const { toast } = useToast();

  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = useCallback(async () => {
    if (!regionId) return;
    setLoading(true);
    const { data } = await supabase
      .from('churches')
      .select('*')
      .eq('region_selected_id', regionId)
      .eq('region_status', 'pending');
    setPending(data ?? []);
    setLoading(false);
  }, [regionId, supabase]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  async function handleApprove(church_id: string) {
    const res = await fetch("/api/church-approval/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ church_id }),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast({ title: "Error", description: data.error ?? "Could not approve church." });
      return;
    }

    toast({ title: "Church Approved", description: "This church is now officially part of your region." });
    fetchPending();
  }

  async function handleReject(church_id: string) {
    const res = await fetch("/api/church-approval/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ church_id }),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast({ title: "Error", description: data.error ?? "Could not reject church." });
      return;
    }

    toast({ title: "Church Rejected", description: "The church has been marked as rejected." });
    fetchPending();
  }

  if (permLoading) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  if (!isRegionalAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading Pending Churches…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Pending Church Approvals"
        subtitle="These churches have selected your region and are awaiting your approval."
      />

      {pending.length === 0 && (
        <p className="text-muted-foreground">No pending churches.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pending.map((church) => (
          <DashboardApprovalRequestCard
            key={church.id}
            name={church.name || "Unknown Church"}
            logoUrl={church.logo_url ?? null}
            logoAlt={`${church.name || "Church"} logo`}
            fallback={String(church.name || "CH")
              .split(' ')
              .map((word: string) => word[0]?.toUpperCase())
              .join('')
              .slice(0, 2)}
            subtitle={church.leader_title || church.leader_name
              ? `${church.leader_title ? `${church.leader_title} ` : ''}${church.leader_name ?? ''}`
              : null}
            meta={church.city || church.state
              ? [church.city, church.state].filter(Boolean).join(', ')
              : null}
            onApprove={() => handleApprove(church.id)}
            onReject={() => handleReject(church.id)}
          />
        ))}
      </div>
    </div>
  );
}

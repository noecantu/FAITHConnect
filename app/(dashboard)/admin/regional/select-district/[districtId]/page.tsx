//app/(dashboard)/admin/regional/select-district/[districtId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { usePermissions } from "@/app/hooks/usePermissions";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/hooks/use-toast";

export default function ConfirmDistrictPage() {
  const supabase = getSupabaseClient();
  const { districtId } = useParams() as { districtId: string };
  const router = useRouter();
  const { toast } = useToast();
  const { isRegionalAdmin, region_id, loading: permLoading } = usePermissions();

  const [district, setDistrict] = useState<Record<string, string | null> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("districts").select("*").eq("id", districtId).single();
      setDistrict(data ?? null);
      setLoading(false);
    }
    load();
  }, [districtId]);

  async function handleConfirm() {
    if (!region_id || !districtId) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("regions")
        .update({
          district_selected_id: districtId,
          district_status: "pending",
          district_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", region_id);

      if (error) throw error;

      toast({
        title: "District Request Sent",
        description: "Your request to join this district is pending approval.",
      });

      router.push("/admin/regional");
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Could not submit district request.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (permLoading || loading) {
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

  if (!district) {
    return <div className="p-6 text-red-500">District not found.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Confirm District</h1>
      <p className="text-muted-foreground">
        Please confirm that you want to request joining this district. The District Admin will need to approve your request.
      </p>

      <Card className="p-6 bg-black/60 border-white/20 backdrop-blur-xl space-y-3">
        {district.logo_url ? (
          <img
            src={district.logo_url}
            alt={`${district.name} logo`}
            className="h-16 w-16 rounded-md object-cover border border-white/20"
          />
        ) : null}

        <p className="text-xl font-semibold">{district.name}</p>

        {(district.region_admin_title || district.region_admin_name) && (
          <p className="text-sm text-muted-foreground">
            {district.region_admin_title ? `${district.region_admin_title}: ` : "Admin: "}
            {district.region_admin_name ?? ""}
          </p>
        )}

        {district.state && (
          <p className="text-sm text-muted-foreground">{district.state}</p>
        )}
      </Card>

      <div className="flex gap-4">
        <Button
          onClick={handleConfirm}
          disabled={saving}
          className="bg-primary text-white"
        >
          {saving ? "Sending…" : "Request to Join"}
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push("/admin/regional/select-district")}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

//app/(dashboard)/admin/regional/select-district/[districtId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { usePermissions } from "@/app/hooks/usePermissions";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/hooks/use-toast";

export default function ConfirmDistrictPage() {
  const { districtId } = useParams() as { districtId: string };
  const router = useRouter();
  const { toast } = useToast();
  const { isRegionalAdmin, regionId, loading: permLoading } = usePermissions();

  const [district, setDistrict] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "districts", districtId));
      if (snap.exists()) {
        setDistrict({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    }
    load();
  }, [districtId]);

  async function handleConfirm() {
    if (!regionId || !districtId) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, "regions", regionId), {
        districtSelectedId: districtId,
        districtStatus: "pending",
        districtId: null,
        updatedAt: new Date(),
      });

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
        {district.logoUrl ? (
          <img
            src={district.logoUrl}
            alt={`${district.name} logo`}
            className="h-16 w-16 rounded-md object-cover border border-white/20"
          />
        ) : null}

        <p className="text-xl font-semibold">{district.name}</p>

        {(district.regionAdminTitle || district.regionAdminName) && (
          <p className="text-sm text-muted-foreground">
            {district.regionAdminTitle ? `${district.regionAdminTitle}: ` : "Admin: "}
            {district.regionAdminName ?? ""}
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

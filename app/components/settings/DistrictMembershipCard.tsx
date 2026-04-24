"use client";

import { useEffect, useState } from "react";
import { getDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/hooks/use-toast";
import { Building2, X } from "lucide-react";

type District = {
  id: string;
  name: string;
  logoUrl?: string | null;
  regionAdminName?: string | null;
  regionAdminTitle?: string | null;
  state?: string | null;
};

interface Props {
  regionId: string;
}

export default function DistrictMembershipCard({ regionId }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [district, setDistrict] = useState<District | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "regions", regionId));
        if (!snap.exists()) return;

        const data = snap.data();
        const districtStatus: string | null = data.districtStatus ?? null;
        setStatus(districtStatus);

        const did = data.districtId || data.districtSelectedId;
        if (did) {
          const dSnap = await getDoc(doc(db, "districts", did));
          if (dSnap.exists()) {
            const d = dSnap.data();
            setDistrict({
              id: dSnap.id,
              name: d.name || "Unknown District",
              logoUrl: d.logoUrl ?? null,
              regionAdminName: d.regionAdminName ?? null,
              regionAdminTitle: d.regionAdminTitle ?? null,
              state: d.state ?? null,
            });
          }
        }
      } catch (err) {
        console.error("Error loading district membership:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [regionId]);

  async function handleRemove() {
    setRemoving(true);
    try {
      await updateDoc(doc(db, "regions", regionId), {
        districtId: null,
        districtSelectedId: null,
        districtStatus: null,
        updatedAt: new Date(),
      });

      setDistrict(null);
      setStatus(null);
      setShowConfirmRemove(false);

      toast({ title: "Removed", description: "Your region has been removed from the district." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not remove district membership." });
    } finally {
      setRemoving(false);
    }
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((w) => w[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "DT";
  }

  const hasDistrict = !!district;

  return (
    <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>District Membership</CardTitle>
            <CardDescription>
              Manage your region&apos;s district association and approval status.
            </CardDescription>
          </div>

          {hasDistrict && (
            <button
              onClick={() => setShowConfirmRemove(true)}
              disabled={removing}
              className={`
                p-2 rounded-md border bg-muted/20 transition
                focus:outline-none focus:ring-2 focus:ring-primary
                ${removing ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"}
              `}
              title="Remove from district"
            >
              {removing ? (
                <div className="h-5 w-5 animate-spin border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <X className="h-5 w-5 text-white" />
              )}
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="h-28 w-full bg-muted animate-pulse rounded-md" />
        ) : hasDistrict ? (
          <>
            {/* Status badge */}
            {status === "approved" && (
              <div className="p-3 rounded-lg border border-emerald-500 bg-emerald-500/10 text-sm">
                <span className="font-semibold text-emerald-400">Approved</span>
                <span className="text-muted-foreground"> — Your region is an active member of this district.</span>
              </div>
            )}
            {status === "pending" && (
              <div className="p-3 rounded-lg border border-yellow-500 bg-yellow-500/10 text-sm">
                <span className="font-semibold text-yellow-400">Pending Approval</span>
                <span className="text-muted-foreground"> — Awaiting the District Admin&apos;s approval.</span>
              </div>
            )}
            {status === "rejected" && (
              <div className="p-3 rounded-lg border border-red-500 bg-red-500/10 text-sm">
                <span className="font-semibold text-red-400">Rejected</span>
                <span className="text-muted-foreground"> — Your last request was rejected. You can remove and re-apply.</span>
              </div>
            )}

            {/* District info */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/10 border border-white/10">
              {district.logoUrl ? (
                <img
                  src={district.logoUrl}
                  alt={`${district.name} logo`}
                  className="h-16 w-16 shrink-0 rounded-md object-cover border border-white/20"
                />
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-md bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground border border-white/20">
                  {getInitials(district.name)}
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
          </>
        ) : (
          /* Placeholder — no district selected */
          <div className="flex flex-col items-center justify-center gap-4 py-8 rounded-lg border border-dashed border-white/20 bg-muted/10 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium text-muted-foreground">No District Selected</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Join a district to connect your region with a broader network.
              </p>
            </div>
            <Button onClick={() => router.push("/admin/regional/select-district")}>
              Select a District
            </Button>
          </div>
        )}

        {/* Remove confirmation */}
        {showConfirmRemove && (
          <div className="border border-red-500 bg-red-500/10 rounded-md p-4 space-y-3">
            <p className="text-sm font-medium text-red-400">Remove from district?</p>
            <p className="text-sm text-muted-foreground">
              This will clear your district association. You will need to re-apply to rejoin.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={removing}
              >
                {removing ? "Removing…" : "Yes, Remove"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmRemove(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

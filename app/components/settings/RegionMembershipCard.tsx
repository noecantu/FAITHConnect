"use client";

import { useEffect, useState } from "react";
import { getDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/hooks/use-toast";
import { Building2, X } from "lucide-react";

type Region = {
  id: string;
  name: string;
  logoUrl?: string | null;
  regionAdminName?: string | null;
  regionAdminTitle?: string | null;
  state?: string | null;
};

interface Props {
  churchId: string;
}

export default function RegionMembershipCard({ churchId }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [region, setRegion] = useState<Region | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "churches", churchId));
        if (!snap.exists()) return;

        const data = snap.data();
        const regionStatus: string | null = data.regionStatus ?? null;
        setStatus(regionStatus);

        const regionDocId = data.regionId || data.regionSelectedId;
        if (regionDocId) {
          const regionSnap = await getDoc(doc(db, "regions", regionDocId));
          if (regionSnap.exists()) {
            const regionData = regionSnap.data();
            setRegion({
              id: regionSnap.id,
              name: regionData.name || "Unknown Region",
              logoUrl: regionData.logoUrl ?? null,
              regionAdminName: regionData.regionAdminName ?? null,
              regionAdminTitle: regionData.regionAdminTitle ?? null,
              state: regionData.state ?? null,
            });
          }
        }
      } catch (err) {
        console.error("Error loading region membership:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [churchId]);

  async function handleRemove() {
    setRemoving(true);

    try {
      await updateDoc(doc(db, "churches", churchId), {
        regionId: null,
        regionSelectedId: null,
        regionStatus: null,
        updatedAt: new Date(),
      });

      setRegion(null);
      setStatus(null);
      setShowConfirmRemove(false);

      toast({ title: "Removed", description: "Your church has been removed from the region." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not remove region membership." });
    } finally {
      setRemoving(false);
    }
  }

  function getInitials(name: string) {
    return (
      name
        .split(" ")
        .map((word) => word[0]?.toUpperCase())
        .join("")
        .slice(0, 2) || "RG"
    );
  }

  const hasRegion = !!region;

  return (
    <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-start justify-between w-full gap-4">
          <div>
            <CardTitle>Region Membership</CardTitle>
            <CardDescription>
              Manage your church&apos;s region association and approval status.
            </CardDescription>
          </div>

          {hasRegion && (
            <button
              onClick={() => setShowConfirmRemove(true)}
              disabled={removing}
              className={`
                p-2 rounded-md border bg-muted/20 transition
                focus:outline-none focus:ring-2 focus:ring-primary
                ${removing ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"}
              `}
              title="Remove from region"
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
        ) : hasRegion ? (
          <>
            {status === "approved" && (
              <div className="p-3 rounded-lg border border-emerald-500 bg-emerald-500/10 text-sm">
                <span className="font-semibold text-emerald-400">Approved</span>
                <span className="text-muted-foreground"> - Your church is an active member of this region.</span>
              </div>
            )}

            {status === "pending" && (
              <div className="p-3 rounded-lg border border-yellow-500 bg-yellow-500/10 text-sm">
                <span className="font-semibold text-yellow-400">Pending Approval</span>
                <span className="text-muted-foreground"> - Awaiting the Regional Admin&apos;s approval.</span>
              </div>
            )}

            {status === "rejected" && (
              <div className="p-3 rounded-lg border border-red-500 bg-red-500/10 text-sm">
                <span className="font-semibold text-red-400">Rejected</span>
                <span className="text-muted-foreground"> - Your last request was rejected. You can remove and re-apply.</span>
              </div>
            )}

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/10 border border-white/10">
              {region.logoUrl ? (
                <img
                  src={region.logoUrl}
                  alt={`${region.name} logo`}
                  className="h-16 w-16 shrink-0 rounded-md object-cover border border-white/20"
                />
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-md bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground border border-white/20">
                  {getInitials(region.name)}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-lg font-semibold truncate">{region.name}</p>
                {region.regionAdminTitle && region.regionAdminName && (
                  <p className="text-sm text-muted-foreground truncate">
                    {region.regionAdminTitle}: {region.regionAdminName}
                  </p>
                )}
                {region.state && <p className="text-sm text-muted-foreground">{region.state}</p>}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-8 rounded-lg border border-dashed border-white/20 bg-muted/10 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium text-muted-foreground">No Region Selected</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Join a region to connect your church with regional oversight and support.
              </p>
            </div>
            <Button onClick={() => router.push(`/admin/church/${churchId}/select-region`)}>
              Select a Region
            </Button>
          </div>
        )}

        {showConfirmRemove && (
          <div className="border border-red-500 bg-red-500/10 rounded-md p-4 space-y-3">
            <p className="text-sm font-medium text-red-400">Remove from region?</p>
            <p className="text-sm text-muted-foreground">
              This will clear your church&apos;s region association. You will need to re-apply to rejoin.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={removing}
              >
                {removing ? "Removing..." : "Yes, Remove"}
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
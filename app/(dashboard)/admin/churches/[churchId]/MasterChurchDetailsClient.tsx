//app/(dashboard)/admin/churches/[churchId]/MasterChurchDetailsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase/client";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { AlertTriangle, CalendarDays, ShieldCheck, Users } from "lucide-react";

import { PageHeader } from "@/app/components/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/app/components/ui/alert-dialog";
import type { Church } from "@/app/lib/types";
import { useToast } from "@/app/hooks/use-toast";

export default function MasterChurchDetailsClient({
  church,
  memberCount,
  serviceCount,
  eventCount,
  admins,
}: {
  church: Church;
  memberCount: number;
  serviceCount: number;
  eventCount: number;
  admins: { uid: string; displayName?: string | null; email: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const churchId = church.id;
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [localChurch, setLocalChurch] = useState<Church>(church);
  const isDisabled = localChurch.status === "disabled";

  const initials = localChurch.name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function updateChurchStatus(nextStatus: "active" | "disabled") {
    setIsUpdatingStatus(true);
    try {
      await updateDoc(doc(db, "churches", churchId), {
        status: nextStatus,
        ...(nextStatus === "active"
          ? { enabledAt: serverTimestamp() }
          : { disabledAt: serverTimestamp() }),
      });

      setLocalChurch((prev) => ({ ...prev, status: nextStatus }));

      toast({
        title: nextStatus === "active" ? "Church Enabled" : "Church Disabled",
        description:
          nextStatus === "active"
            ? `${localChurch.name} is now operational.`
            : `${localChurch.name} access is now restricted.`,
      });

      if (nextStatus === "disabled") {
        setShowDisableDialog(false);
      }
    } catch (error) {
      console.error("Failed to update church status", error);
      toast({
        title: "Status Update Failed",
        description: "Could not update church status. Please try again.",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <div className="space-y-6">

      <PageHeader
        title={localChurch.name}
        subtitle="System-level church details"
      />

      {/* Identity */}
      <Card className="border-white/15">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
          {localChurch.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={localChurch.logoUrl}
              alt="Church Logo"
              className="w-12 h-12 rounded-md object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-lg font-bold">
              {initials}
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold">{localChurch.name}</h2>
            <p className="text-muted-foreground">{localChurch.timezone}</p>
          </div>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
              isDisabled
                ? "border-rose-400/30 bg-rose-500/10 text-rose-300"
                : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${isDisabled ? "bg-rose-300" : "bg-emerald-300"}`}
            />
            {isDisabled ? "Disabled" : "Operational"}
          </div>
        </CardContent>
      </Card>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Stats */}
        <Card className="border-cyan-500/20">
          <CardHeader>
            <CardTitle>Church Stats</CardTitle>
            <CardDescription>System-level overview</CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-muted-foreground">Members</p>
              <p className="mt-1 text-2xl font-semibold">{memberCount}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-muted-foreground">Upcoming Services</p>
              <p className="mt-1 text-2xl font-semibold">{serviceCount}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-muted-foreground">Events This Week</p>
              <p className="mt-1 text-2xl font-semibold">{eventCount}</p>
            </div>
          </CardContent>
        </Card>

        {/* Admins */}
        <Card className="border-blue-500/20">
          <CardHeader>
            <CardTitle>Church Admins</CardTitle>
            <CardDescription>Users with Admin role</CardDescription>
          </CardHeader>

          <CardContent className="space-y-2 text-sm">
            {admins.length === 0 ? (
              <p className="text-muted-foreground">No admins assigned.</p>
            ) : (
              admins.map((admin) => {
                const name = admin.displayName || admin.email || "";
                const initials = name
                  .split(" ")
                  .filter(Boolean)
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={admin.uid}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                      {initials || "?"}
                    </div>
                    <span>{name || "Unknown User"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Admin</span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

      </div>

      {/* Actions */}
      <Card className="border-amber-500/20">
        <CardHeader>
          <CardTitle>High-Level Controls</CardTitle>
          <CardDescription>System-level actions for this church</CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">

          <Button
            className="w-full justify-start"
            disabled={isUpdatingStatus}
            onClick={() => {
              router.push(`/admin/church/${churchId}`);
            }}
          >
            <ShieldCheck className="h-4 w-4" />
            Open as Church Admin
          </Button>

          <Button
            className="w-full justify-start"
            disabled={isUpdatingStatus}
            onClick={() => {
              router.push(`/admin/churches/${churchId}/edit`);
            }}
          >
            <CalendarDays className="h-4 w-4" />
            Edit Church
          </Button>

          <Button
            className="w-full justify-start"
            disabled={isUpdatingStatus}
            onClick={() => {
              router.push(`/admin/churches/${churchId}/add-user`);
            }}
          >
            <Users className="h-4 w-4" />
            Add User
          </Button>

          {isDisabled ? (
            <Button
              className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
              disabled={isUpdatingStatus}
              onClick={() => {
                void updateChurchStatus("active");
              }}
            >
              {isUpdatingStatus ? "Enabling Church..." : "Enable Church"}
            </Button>
          ) : (
            <Button
              variant="destructive"
              className="w-full justify-start"
              disabled={isUpdatingStatus}
              onClick={() => setShowDisableDialog(true)}
            >
              Disable Church
            </Button>
          )}

        </CardContent>
      </Card>

      {/* Disable Confirmation */}
      <AlertDialog
        open={showDisableDialog}
        onOpenChange={(open) => {
          if (!isUpdatingStatus) setShowDisableDialog(open);
        }}
      >
        <AlertDialogContent className="border-rose-500/30 sm:max-w-[560px]">
          <AlertDialogHeader>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-400/30 bg-rose-500/10 text-rose-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-left">Disable this church?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to disable <span className="font-semibold text-foreground">{localChurch.name}</span>.
              This blocks access for all users in that church.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-lg border border-rose-400/20 bg-rose-500/5 p-3 text-sm">
            <p className="font-medium text-rose-300">What happens next</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Church users lose access immediately.</li>
              <li>No church data is deleted.</li>
              <li>You can re-enable this church anytime.</li>
            </ul>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" disabled={isUpdatingStatus}>Keep Church Active</Button>
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isUpdatingStatus}
              onClick={() => {
                void updateChurchStatus("disabled");
              }}
            >
              {isUpdatingStatus ? "Disabling Church..." : "Yes, Disable Church"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

"use client";

import { useState } from "react";
import { db } from "@/app/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";

export default function MasterChurchDetailsClient({
  church,
  memberCount,
  serviceCount,
  eventCount,
  admins,
}: {
  church: any;
  memberCount: number;
  serviceCount: number;
  eventCount: number;
  admins: any[];
}) {
  const churchId = church.id;
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [localChurch, setLocalChurch] = useState(church);

  const initials = localChurch.name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="p-6 space-y-8">

      <PageHeader
        title={localChurch.name}
        subtitle="System-level church details"
      />

      {/* Identity */}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          {localChurch.logoUrl ? (
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
        </CardContent>
      </Card>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Church Stats</CardTitle>
            <CardDescription>System-level overview</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <p><strong>Members:</strong> {memberCount}</p>
            <p><strong>Upcoming Services:</strong> {serviceCount}</p>
            <p><strong>Events This Week:</strong> {eventCount}</p>
          </CardContent>
        </Card>

        {/* Admins */}
        <Card>
          <CardHeader>
            <CardTitle>Church Admins</CardTitle>
            <CardDescription>Users with Admin role</CardDescription>
          </CardHeader>

          <CardContent className="space-y-2 text-sm">
            {admins.length === 0 ? (
              <p className="text-muted-foreground">No admins assigned.</p>
            ) : (
              admins.map((admin) => (
                <div key={admin.id} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                    {(admin.displayName || admin.email)
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <span>{admin.displayName || admin.email}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>High-Level Controls</CardTitle>
          <CardDescription>System-level actions for this church</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">

          <Button
            className="w-full"
            onClick={() => {
              window.location.href = `/admin/church/${churchId}`;
            }}
          >
            Open as Church Admin
          </Button>

          <Button
            className="w-full"
            onClick={() => {
              window.location.href = `/admin/churches/${churchId}/edit`;
            }}
          >
            Edit Church
          </Button>

          <Button
            className="w-full"
            onClick={() => {
              window.location.href = `/admin/churches/${churchId}/add-admin`;
            }}
          >
            Add Admin
          </Button>

          {localChurch.status === "disabled" ? (
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={async () => {
                await updateDoc(doc(db, "churches", churchId), {
                  status: "active",
                  enabledAt: new Date().toISOString(),
                });
                setLocalChurch((prev: any) => ({ ...prev, status: "active" }));
              }}
            >
              Enable Church
            </Button>
          ) : (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowDisableDialog(true)}
            >
              Disable Church
            </Button>
          )}

        </CardContent>
      </Card>

      {/* Disable Confirmation */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable this church?</AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent all users from accessing this church.
              No data will be deleted, and you can re-enable it later.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await updateDoc(doc(db, "churches", churchId), {
                  status: "disabled",
                  disabledAt: new Date().toISOString(),
                });
                setLocalChurch((prev: any) => ({ ...prev, status: "disabled" }));
                setShowDisableDialog(false);
              }}
            >
              Disable Church
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

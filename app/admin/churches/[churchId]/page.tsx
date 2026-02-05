"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/app/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getCountFromServer,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { PageHeader } from "@/app/components/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/app/components/ui/alert-dialog";

export default function MasterChurchDetailsPage() {
  const { churchId } = useParams();
  const churchIdStr = Array.isArray(churchId) ? churchId[0] : churchId;
  if (!churchIdStr) {
    console.error("Invalid churchId param");
    return null;
  }

  const [church, setChurch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [memberCount, setMemberCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [admins, setAdmins] = useState<any[]>([]);
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  useEffect(() => {
    async function load() {
      if (!churchId) return;

      setLoading(true);

      // 1. Load church document
      const churchRef = doc(db, "churches", churchId as string);
      const churchSnap = await getDoc(churchRef);

      if (churchSnap.exists()) {
        setChurch(churchSnap.data());
      }

      // 2. Members count
      const membersRef = collection(db, "churches", churchId as string, "members");
      const membersSnap = await getCountFromServer(membersRef);
      setMemberCount(membersSnap.data().count);

      // 3. Upcoming services
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const servicesRef = collection(
        db,
        "churches",
        churchId as string,
        "servicePlans"
      );
      const servicesQuery = query(
        servicesRef,
        where("date", ">=", today.toISOString())
      );
      const servicesSnap = await getCountFromServer(servicesQuery);
      setServiceCount(servicesSnap.data().count);

      // 4. Events this week
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() + diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const eventsRef = collection(
        db,
        "churches",
        churchId as string,
        "events"
      );
      const eventsQuery = query(
        eventsRef,
        where("date", ">=", startOfWeek.toISOString()),
        where("date", "<=", endOfWeek.toISOString())
      );
      const eventsSnap = await getCountFromServer(eventsQuery);
      setEventCount(eventsSnap.data().count);

      // 5. Church Admins
      const usersRef = collection(db, "users");
      const adminsQuery = query(
        usersRef,
        where("churchId", "==", churchId),
        where("roles", "array-contains", "Admin")
      );
      const adminsSnap = await getDocs(adminsQuery);
      setAdmins(adminsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      setLoading(false);
    }

    load();
  }, [churchId]);

  if (loading || !church) {
    return (
      <div className="flex justify-center items-center min-h-screen text-foreground">
        Loading church details…
      </div>
    );
  }

  const initials = church.name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="p-6 space-y-8">

      {/* Page Header */}
      <PageHeader
        title={church.name}
        subtitle="System-level church details"
      />

      {/* Identity Header (A1 minimal style) */}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          {church.logoUrl ? (
            <img
              src={church.logoUrl}
              alt="Church Logo"
              className="w-12 h-12 rounded-md object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-lg font-bold">
              {initials}
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold">{church.name}</h2>
            <p className="text-muted-foreground">{church.timezone}</p>
          </div>
        </CardContent>
      </Card>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Stats Card */}
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

        {/* Admins Card */}
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

          {/* Open as Church Admin */}
          <Button
            className="w-full"
            onClick={() => {
              // No impersonation needed — just navigate into the church admin dashboard
              window.location.href = `/admin/church/${churchId}`;
            }}
          >
            Open as Church Admin
          </Button>

          {/* Edit Church */}
          <Button
            className="w-full"
            onClick={() => {
              window.location.href = `/admin/churches/${churchId}/edit`;
            }}
          >
            Edit Church
          </Button>

          {/* Add Admin */}
          <Button
            className="w-full"
            onClick={() => {
              window.location.href = `/admin/churches/${churchId}/add-admin`;
            }}
          >
            Add Admin
          </Button>

          {/* Disable/Enable Church */}
          {church.status === "disabled" ? (
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={async () => {
                try {
                  await updateDoc(doc(db, "churches", churchIdStr), {
                    status: "active",
                    enabledAt: new Date().toISOString(),
                  });
                  setChurch((prev: any) => ({ ...prev, status: "active" }));
                } catch (err) {
                  console.error("Failed to enable church:", err);
                }
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

      {/* Disable Confirmation Dialog */}
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
                try {
                  await updateDoc(doc(db, "churches", churchIdStr), {
                    status: "disabled",
                    disabledAt: new Date().toISOString(),
                  });
                  setShowDisableDialog(false);
                  // Optional: toast notification
                } catch (err) {
                  console.error("Failed to disable church:", err);
                }
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

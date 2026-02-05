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
} from "firebase/firestore";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";

import { Button } from "@/app/components/ui/button";

export default function MasterChurchDetailsPage() {
  const { churchId } = useParams();

  const [church, setChurch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [memberCount, setMemberCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [admins, setAdmins] = useState<any[]>([]);

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

      // 5. Church Admins (global users collection)
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

      {/* Identity Card */}
      <Card>
        <CardContent className="flex items-center gap-6 p-6">
          {church.logoUrl ? (
            <img
              src={church.logoUrl}
              alt="Church Logo"
              className="w-20 h-20 rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-xl font-bold">
              {initials}
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold">{church.name}</h1>
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

          <CardContent className="space-y-2">
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

          <CardContent className="space-y-2">
            {admins.length === 0 ? (
              <p>No admins assigned.</p>
            ) : (
              admins.map((admin) => (
                <p key={admin.id}>
                  {admin.displayName || admin.email}  
                </p>
              ))
            )}
          </CardContent>
        </Card>

      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Master Admin Actions</CardTitle>
          <CardDescription>High-level controls</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <Button className="w-full">Open as Church Admin</Button>
          <Button className="w-full">Edit Church</Button>
          <Button className="w-full">Add Admin</Button>
          <Button variant="destructive" className="w-full">
            Disable Church
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}

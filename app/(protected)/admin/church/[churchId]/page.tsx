"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/app/lib/firebase";
import Image from "next/image";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
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
import { CalendarCheck, CalendarHeart, Calendar, Music, UserPlus } from "lucide-react";
import Link from "next/link";
import type { Church } from "@/app/lib/types";

export default function ChurchAdminDashboard() {
  const { churchId } = useParams();

  const [user, userLoading] = useAuthState(auth);

  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);

  const [memberCount, setMemberCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    async function load() {
      if (userLoading) return;

      if (!user) {
        setLoading(false);
        return;
      }

      if (!churchId) return;

      setLoading(true);

      // 1. Load church document
      const churchRef = doc(db, "churches", churchId as string);
      const churchSnap = await getDoc(churchRef);

      if (!churchSnap.exists()) {
        setLoading(false);
        return;
      }

      const churchData = churchSnap.data() as Church;
      setChurch(churchData);

      if (churchData.status === "disabled") {
        setLoading(false);
        return;
      }

      // 2. Members count
      const membersRef = collection(
        db,
        "churches",
        churchId as string,
        "members"
      );
      const membersSnap = await getDocs(membersRef);
      setMemberCount(membersSnap.size);

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
      const servicesSnap = await getDocs(servicesQuery);
      setServiceCount(servicesSnap.size);

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
      const eventsSnap = await getDocs(eventsQuery);
      setEventCount(eventsSnap.size);

      setLoading(false);
    }

    load();
  }, [user, userLoading, churchId]);

  // ---------------------------
  // RENDER STATES
  // ---------------------------

  if (userLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen text-foreground">
        You do not have access to this church.
      </div>
    );
  }

  if (loading || !church) {
    return (
      <div className="flex justify-center items-center min-h-screen text-foreground">
        Loading church dashboard…
      </div>
    );
  }

  if (church.status === "disabled") {
    return (
      <div className="flex justify-center items-center min-h-screen text-foreground">
        This church is currently disabled.
      </div>
    );
  }

  // ---------------------------
  // NORMAL RENDER
  // ---------------------------

  const initials = church.name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="p-4 space-y-4">

      {/* Page Header */}
      <PageHeader
        title="Church Admin Dashboard"
        subtitle="Manage your church’s people, events, and ministries."
      />

      {/* Large Identity Header */}
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-4">

          {/* Logo */}
          {church.logoUrl ? (
            <Image
              src={church.logoUrl}
              alt="Church Logo"
              width={144}
              height={144}
              className="w-80 h-80 p-0 object-contain"
            />
          ) : (
            <div className="w-80 h-80 rounded-xl bg-muted flex items-center justify-center text-3xl font-bold">
              {initials}
            </div>
          )}

          {/* Name + Timezone beneath logo */}
          <div className="text-center space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">
              {church.name}
            </h1>

            <p className="text-muted-foreground text-lg">
              {church.timezone}
            </p>
          </div>

        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Total registered members</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{memberCount}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Services</CardTitle>
            <CardDescription>Scheduled from today forward</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{serviceCount}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events This Week</CardTitle>
            <CardDescription>Monday through Sunday</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{eventCount}</CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your church</CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Button asChild className="w-full flex items-center gap-2">
            <Link href="/attendance">
              <CalendarCheck className="h-4 w-4 text-foreground/70" />
              <span>Attendance</span>
            </Link>
          </Button>

          <Button asChild className="w-full flex items-center gap-2">
            <Link href="/calendar">
              <Calendar className="h-4 w-4 text-foreground/70" />
              <span>Events</span>
            </Link>
          </Button>

          <Button asChild className="w-full flex items-center gap-2">
            <Link href="/members">
              <UserPlus className="h-4 w-4 text-foreground/70" />
              <span>Members</span>
            </Link>
          </Button>
          
          <Button asChild className="w-full flex items-center gap-2">
            <Link href="/music/setlists">
              <Music className="h-4 w-4 text-foreground/70" />
              <span>Set Lists</span>
            </Link>
          </Button>

          <Button asChild className="w-full flex items-center gap-2">
            <Link href="/service-plan">
              <CalendarHeart className="h-4 w-4 text-foreground/70" />
              <span>Service Plans</span>
            </Link>
          </Button>

        </CardContent>
      </Card>

    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/app/lib/firebase/client";

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

import {
  CalendarCheck,
  CalendarHeart,
  Calendar,
  FileText,
  Music,
  UserPlus,
} from "lucide-react";

import Link from "next/link";
import type { Church } from "@/app/lib/types";
import { useAuth } from "@/app/hooks/useAuth";
import { DashboardPage } from "@/app/(dashboard)/layout/DashboardPage";

export default function ChurchAdminDashboard() {
  const { churchId } = useParams();
  const { user, loading: userLoading } = useAuth();

  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);

  const [memberCount, setMemberCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [attendanceThisWeek, setAttendanceThisWeek] = useState(0);

  // ------------------------------------------------------
  // FIXED EFFECT — NO EARLY RETURNS THAT FREEZE THE PAGE
  // ------------------------------------------------------
  useEffect(() => {
    // 1. Wait for Firebase auth to finish
    if (userLoading) return;

    // 2. If user is not logged in → stop loading
    if (!user) {
      setLoading(false);
      return;
    }

    // 3. Wait for churchId to be available
    //    - undefined → still loading
    //    - null → user has no church
    if (churchId === undefined) return;

    if (churchId === null) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);

      // ---------------------------
      // Compute week range FIRST
      // ---------------------------
      const now = new Date();
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() + diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // ---------------------------
      // 1. Load church document
      // ---------------------------
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

      // ---------------------------
      // 2. Members count
      // ---------------------------
      const membersRef = collection(
        db,
        "churches",
        churchId as string,
        "members"
      );

      const membersQuery = query(
        membersRef,
        where("status", "!=", "Archived")
      );

      const membersSnap = await getDocs(membersQuery);
      setMemberCount(membersSnap.size);


      // ---------------------------
      // 3. Upcoming Services
      // ---------------------------
      const todayIso = new Date().toISOString().slice(0, 10);

      const servicesRef = collection(
        db,
        "churches",
        churchId as string,
        "servicePlans"
      );

      const servicesQuery = query(
        servicesRef,
        where("dateString", ">=", todayIso)
      );

      const servicesSnap = await getDocs(servicesQuery);
      setServiceCount(servicesSnap.size);

      // ---------------------------
      // 4. Events This Week
      // ---------------------------
      const eventsRef = collection(
        db,
        "churches",
        churchId as string,
        "events"
      );

      const eventsQuery = query(
        eventsRef,
        where("date", ">=", startOfWeek),
        where("date", "<=", endOfWeek)
      );

      const eventsSnap = await getDocs(eventsQuery);
      setEventCount(eventsSnap.size);

      // ---------------------------
      // 5. Attendance This Week
      // ---------------------------
      const attendanceRef = collection(
        db,
        "churches",
        churchId as string,
        "attendance"
      );

      const startIso = startOfWeek.toISOString().slice(0, 10);
      const endIso = endOfWeek.toISOString().slice(0, 10);

      const attendanceQuery = query(
        attendanceRef,
        where("__name__", ">=", startIso),
        where("__name__", "<=", endIso)
      );

      const attendanceSnap = await getDocs(attendanceQuery);

      let totalPresent = 0;

      attendanceSnap.forEach((docSnap) => {
        const data = docSnap.data();

        const recordCount =
          data.records && typeof data.records === "object"
            ? Object.keys(data.records).filter(
                (id) => data.records[id] === true
              ).length
            : 0;

        let visitorCount = 0;

        if (typeof data.visitors === "number") {
          visitorCount = data.visitors;
        } else if (
          data.visitors &&
          typeof data.visitors === "object" &&
          !Array.isArray(data.visitors)
        ) {
          visitorCount = Object.keys(data.visitors).length;
        }

        totalPresent += recordCount + visitorCount;
      });

      setAttendanceThisWeek(totalPresent);

      setLoading(false);
    }

    load();
  }, [user, userLoading, churchId]);

  // ---------------------------
  // RENDER STATES
  // ---------------------------

  if (userLoading) {
    return (
      <DashboardPage>
        Loading…
      </DashboardPage>
    );
  }

  if (!user) {
    return (
      <DashboardPage>
        You do not have access to this church.
      </DashboardPage>
    );
  }

  if (loading) {
    return (
      <DashboardPage>
        Loading Church Dashboard…
      </DashboardPage>
    );
  }

  if (!church) {
    return (
      <DashboardPage>
        Loading Church Dashboard…
      </DashboardPage>
    );
  }

  if (church.status === "disabled") {
    return (
      <DashboardPage>
        This church is currently disabled.
      </DashboardPage>
    );
  }

  // ---------------------------
  // NORMAL RENDER
  // ---------------------------
  return (
    <DashboardPage>
      <main className="flex-1 flex flex-col space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Church Admin Dashboard"
          subtitle="Manage your church’s members, events, and ministries."
        />

        {/* Identity Header */}
        <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
          <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 md:p-6">
            {/* Left: Logo + Name */}
            <div className="flex items-center gap-4">
              {church.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={church.logoUrl}
                  alt={church.name}
                  className="h-32 w-32 rounded-md object-cover border border-border bg-white ring-2 ring-primary/20 shadow-md"
                />
              ) : (
                <div className="h-32 w-32 rounded-md bg-muted flex items-center justify-center text-lg font-semibold text-muted-foreground border border-border">
                  {church.name?.charAt(0)}
                </div>
              )}

              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  {church.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Timezone: {church.timezone}
                </p>
              </div>
            </div>

            {/* Right: Status */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-border bg-blue-500/15 px-3 py-1 text-xs font-medium text-muted-foreground">
                Status: {church.status === "disabled" ? "Disabled" : "Active"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Members"
            description="Including Prospects"
            value={memberCount}
          />
          <StatCard
            title="Upcoming Services"
            description="Scheduled From Today"
            value={serviceCount}
          />
          <StatCard
            title="Events This Week"
            description="Monday - Sunday"
            value={eventCount}
          />
          <StatCard
            title="Attendance This Week"
            description="Monday – Sunday"
            value={attendanceThisWeek}
          />
        </div>

        {/* Quick Actions */}
        <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>Main Areas</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickAction href="/attendance" icon={CalendarCheck} label="Attendance" />
            <QuickAction href="/calendar" icon={Calendar} label="Events" />
            <QuickAction href={`/church/${churchId}/members`} icon={UserPlus} label="Members" />
            <QuickAction href="/reports" icon={FileText} label="Reports" />
            <QuickAction href="/music/setlists" icon={Music} label="Set Lists" />
            <QuickAction href="/service-plan" icon={CalendarHeart} label="Service Plans" />
          </CardContent>
        </Card>
      </main>
    </DashboardPage>
  );
}

// ---------------------------
// Small Components
// ---------------------------
type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

function StatCard({
  title,
  description,
  value,
}: {
  title: string;
  description: string;
  value: number;
}) {
  return (
    <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>

      <CardContent className="pt-1">
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: IconType;
  label: string;
}) {
  return (
    <Button
      asChild
      variant="ghost"
      className="
        w-full justify-start gap-3
        bg-black/80 border border-white/20 backdrop-blur-xl
        hover:bg-white/5 hover:border-white/20
        text-white/80
        transition
      "
    >
      <Link href={href}>
        <Icon className="h-5 w-5 text-white/70" />
        <span className="font-medium">{label}</span>
      </Link>
    </Button>
  );
}

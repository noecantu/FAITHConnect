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

import {
  CalendarCheck,
  CalendarHeart,
  Calendar,
  Music,
  UserPlus,
  LayoutDashboard,
} from "lucide-react";

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
  const [attendanceThisWeek, setAttendanceThisWeek] = useState(0);

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

      console.log("CHURCH DOC:", churchData);
      
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

      // 5. Attendance This Week (FULLY NORMALIZED)
      const attendanceRef = collection(
        db,
        "churches",
        churchId as string,
        "attendance"
      );

      // Convert week range to ISO strings (YYYY-MM-DD)
      const startIso = startOfWeek.toISOString().slice(0, 10);
      const endIso = endOfWeek.toISOString().slice(0, 10);

      // Query by document ID (because your docs do NOT have a "date" field)
      const attendanceQuery = query(
        attendanceRef,
        where("__name__", ">=", startIso),
        where("__name__", "<=", endIso)
      );

      const attendanceSnap = await getDocs(attendanceQuery);

      let totalPresent = 0;

      attendanceSnap.forEach(docSnap => {
        const data = docSnap.data();

        // Your actual attendance data is stored in `records`
        const recordCount =
          data.records && typeof data.records === "object"
            ? Object.keys(data.records).length
            : 0;

        // Visitors (if you ever add them later)
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

      console.log("ATTENDANCE TOTAL:", totalPresent, typeof totalPresent);

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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-border bg-muted/20">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center overflow-hidden">
            {church.logoUrl ? (
              <Image
                src={church.logoUrl}
                alt="Church Logo"
                width={40}
                height={40}
                className="object-contain w-full h-full p-1.5"
              />
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">
                {initials}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold truncate">
              {church.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {church.timezone}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          <SidebarLink href={`/church/${churchId}/admin`} icon={LayoutDashboard} label="Dashboard" active />
          <SidebarLink href="/members" icon={UserPlus} label="Members" />
          <SidebarLink href="/attendance" icon={CalendarCheck} label="Attendance" />
          <SidebarLink href="/calendar" icon={Calendar} label="Events" />
          <SidebarLink href="/service-plan" icon={CalendarHeart} label="Service Plans" />
          <SidebarLink href="/music/setlists" icon={Music} label="Set Lists" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="border-b border-border bg-background/80 backdrop-blur">
          <div className="px-4 md:px-8 py-4">
            <PageHeader
              title="Church Admin Dashboard"
              subtitle="Manage your church’s people, events, and ministries."
            />
          </div>
        </div>

        <div className="flex-1 px-4 md:px-8 py-6 space-y-6">
          {/* Identity Header */}
          <Card className="border border-border bg-card/80">
            <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 md:p-6">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  {church.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Timezone: {church.timezone}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                  Status: {church.status === "active" ? "Active" : "Disabled"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Members"
              description="Total registered members"
              value={memberCount}
            />
            <StatCard
              title="Upcoming Services"
              description="Scheduled from today forward"
              value={serviceCount}
            />
            <StatCard
              title="Events This Week"
              description="Monday through Sunday"
              value={eventCount}
            />
            <StatCard
              title="Attendance This Week"
              description="Total present Monday–Sunday"
              value={attendanceThisWeek}
            />
          </div>

          {/* Quick Actions (now more compact, secondary) */}
          <Card className="border border-border bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Jump into key areas of your church.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <QuickAction href="/attendance" icon={CalendarCheck} label="Attendance" />
              <QuickAction href="/calendar" icon={Calendar} label="Events" />
              <QuickAction href="/members" icon={UserPlus} label="Members" />
              <QuickAction href="/music/setlists" icon={Music} label="Set Lists" />
              <QuickAction href="/service-plan" icon={CalendarHeart} label="Service Plans" />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

// ---------------------------
// Small Components
// ---------------------------

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

function SidebarLink({
  href,
  icon: Icon,
  label,
  active = false,
}: {
  href: string;
  icon: IconType;
  label: string;
  active?: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={[
          "flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer",
          active
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        ].join(" ")}
      >
        <Icon className="h-4 w-4" />
        <span className="truncate">{label}</span>
      </div>
    </Link>
  );
}

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
    <Card className="border border-border bg-card/80">
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
      variant="outline"
      className="w-full justify-start gap-2 border-border bg-background/60 hover:bg-muted/70"
    >
      <Link href={href}>
        <Icon className="h-4 w-4 text-foreground/70" />
        <span>{label}</span>
      </Link>
    </Button>
  );
}
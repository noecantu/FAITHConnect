//app/(dashboard)/admin/church/[churchId]/page.tsx
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
  DollarSign,
  Users,
  Church as ChurchIcon,
  Activity,
} from "lucide-react";

import Link from "next/link";
import type { Church } from "@/app/lib/types";
import { useAuth } from "@/app/hooks/useAuth";
import { usePermissions } from "@/app/hooks/usePermissions";
import { formatPhone } from "@/app/lib/formatters";
import { ChurchDisabledNotice } from "@/app/components/layout/ChurchDisabledNotice";

export default function ChurchAdminDashboard() {
  const { churchId } = useParams();
  const { user, loading: userLoading } = useAuth();
  const { isRegionalAdmin, isRootAdmin } = usePermissions();
  const isReadOnly = isRegionalAdmin && !isRootAdmin;
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
      try {
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
          return;
        }

        const churchData = churchSnap.data() as Church;
        setChurch(churchData);

        if (churchData.status === "disabled") {
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
      } catch (error: unknown) {
        const code =
          typeof error === "object" && error !== null && "code" in error
            ? String((error as { code?: unknown }).code)
            : "";

        // Initial login can briefly race claim/session propagation.
        // Avoid noisy console errors for expected transient denials.
        if (code !== "permission-denied") {
          console.error("Error loading church admin dashboard:", error);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, userLoading, churchId]);

  // ---------------------------
  // RENDER STATES
  // ---------------------------

  if (userLoading) {
    return (
      <>
        Loading…
      </>
    );
  }

  if (!user) {
    return (
      <>
        You do not have access to this church.
      </>
    );
  }

  if (loading) {
    return (
      <>
        Loading Church Dashboard…
      </>
    );
  }

  if (!church) {
    return (
      <>
        Loading Church Dashboard…
      </>
    );
  }

  if (church.status === "disabled") {
    return (
      <main className="flex-1 flex flex-col space-y-6">
        <PageHeader
          title="Church Dashboard"
          subtitle="System-level church details"
        />
        <ChurchDisabledNotice churchName={church.name} />
      </main>
    );
  }

  const isChurchDisabled = church.status === "disabled";
  const statusLabel = isChurchDisabled ? "Disabled" : "Active";
  const accessModeLabel = isReadOnly ? "Read-Only" : "Full Access";

  // ---------------------------
  // NORMAL RENDER
  // ---------------------------
  return (
    <>
      <main className="flex-1 flex flex-col space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Church Dashboard"
          subtitle={
            isReadOnly
              ? "Viewing church data in read-only mode."
              : "Manage your church’s members, events, and ministries."
          }
        />

        {/* Identity Header */}
        <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
          <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 md:p-6">
            {/* Left: Logo + Name */}
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
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

              <div>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  {church.name}
                </h1>

                {(church.leaderTitle || church.leaderName) && (
                  <p className="text-lg font-medium text-muted-foreground">
                    {church.leaderTitle ? church.leaderTitle + " " : ""}
                    {church.leaderName ?? ""}
                  </p>
                )}
                {church.address && (
                  <p className="text-sm text-muted-foreground">{church.address}</p>
                )}
                {(church.city || church.state || church.zip) && (
                  <p className="text-sm text-muted-foreground">
                    {[church.city, church.state].filter(Boolean).join(", ")}
                    {church.zip ? ` ${church.zip}` : ""}
                  </p>
                )}
                {church.phone && (
                  <p className="text-sm text-muted-foreground">{formatPhone(church.phone)}</p>
                )}
              </div>
            </div>

            {/* Right: Status Panel */}
            <div className="w-full md:w-auto md:min-w-[240px] rounded-xl border border-white/15 bg-white/[0.03] p-3 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/60">System Status</p>

              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-white/65">Operational</span>
                  <span
                    className={`inline-flex items-center gap-2 text-xs font-semibold ${
                      isChurchDisabled ? "text-rose-200" : "text-emerald-200"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isChurchDisabled ? "bg-rose-300" : "bg-emerald-300"
                      }`}
                    />
                    {statusLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-2">
                  <span className="text-xs text-white/65">Access Mode</span>
                  <span className="text-xs font-medium text-white/85">{accessModeLabel}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Members"
            description="Including Prospects"
            value={memberCount}
            icon={Users}
            iconClassName="text-blue-500"
          />
          <StatCard
            title="Upcoming Services"
            description="Scheduled From Today"
            value={serviceCount}
            icon={ChurchIcon}
            iconClassName="text-violet-500"
          />
          <StatCard
            title="Events This Week"
            description="Monday - Sunday"
            value={eventCount}
            icon={Calendar}
            iconClassName="text-sky-500"
          />
          <StatCard
            title="Attendance This Week"
            description="Monday – Sunday"
            value={attendanceThisWeek}
            icon={Activity}
            iconClassName="text-amber-500"
          />
        </div>

        {/* Quick Actions */}
        <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>Main Areas</CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickAction href={`/church/${churchId}/attendance`} icon={CalendarCheck} label="Attendance" iconClassName="text-amber-500" />
            <QuickAction href={`/church/${churchId}/contributions`} icon={DollarSign} label="Contributions" iconClassName="text-emerald-500" />
            <QuickAction href={`/church/${churchId}/calendar`} icon={Calendar} label="Events" iconClassName="text-sky-500" />
            <QuickAction href={`/church/${churchId}/members`} icon={UserPlus} label="Members" iconClassName="text-blue-500" />
            <QuickAction href={`/church/${churchId}/reports`} icon={FileText} label="Reports" iconClassName="text-orange-500" />
            <QuickAction href={`/church/${churchId}/music/setlists`} icon={Music} label="Set Lists" iconClassName="text-gray-500" />
            <QuickAction href={`/church/${churchId}/service-plan`} icon={CalendarHeart} label="Service Plans" iconClassName="text-violet-500" />
          </CardContent>
        </Card>
      </main>
    </>
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
  icon: Icon,
  iconClassName,
}: {
  title: string;
  description: string;
  value: number;
  icon: IconType;
  iconClassName?: string;
}) {
  return (
    <Card className="relative overflow-hidden bg-black/80 border-white/20 backdrop-blur-xl transition hover:border-white/30">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent" />

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-medium text-white/90">{title}</CardTitle>
            <CardDescription className="text-xs text-white/60">{description}</CardDescription>
          </div>

          <div className="rounded-md border border-white/20 bg-white/5 p-2">
            <Icon className={`h-4 w-4 ${iconClassName ?? "text-white/70"}`} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-1">
        <div className="text-3xl font-semibold tracking-tight text-white">{value}</div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  iconClassName,
}: {
  href: string;
  icon: IconType;
  label: string;
  iconClassName?: string;
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
        <Icon className={`h-5 w-5 ${iconClassName ?? "text-white/70"}`} />
        <span className="font-medium">{label}</span>
      </Link>
    </Button>
  );
}

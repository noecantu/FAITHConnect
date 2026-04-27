//app/(dashboard)/admin/church/[church_id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";

import { PageHeader } from "@/app/components/page-header";
import {
  Card,
  CardContent,
} from "@/app/components/ui/card";
import {
  DashboardIconQuickActionsCard,
  DashboardMetricCard,
} from "@/app/components/ui/dashboard-cards";

import {
  CalendarCheck,
  CalendarHeart,
  Calendar,
  FileText,
  Music,
  Music2,
  UserPlus,
  HandCoins,
  Users,
  Church as ChurchIcon,
  Activity,
} from "lucide-react";

import type { Church } from "@/app/lib/types";
import { useAuth } from "@/app/hooks/useAuth";
import { usePermissions } from "@/app/hooks/usePermissions";
import { formatPhone } from "@/app/lib/formatters";
import { ChurchDisabledNotice } from "@/app/components/layout/ChurchDisabledNotice";
import { BillingLapsedNotice } from "@/app/components/layout/BillingLapsedNotice";

export default function ChurchAdminDashboard() {
  const params = useParams();
  const churchId = typeof params?.churchId === "string" ? params.churchId : null;
  const { user, loading: userLoading } = useAuth();
  const { isRegionalAdmin, isRootAdmin } = usePermissions();
  const isReadOnly = isRegionalAdmin && !isRootAdmin;
  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);
  const [churchNotFound, setChurchNotFound] = useState(false);

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
    if (churchId === null) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setChurchNotFound(false);
      const supabase = getSupabaseClient();
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
        // 1. Load church document (via API route to bypass RLS)
        // ---------------------------
        const churchRes = await fetch(`/api/church/${encodeURIComponent(churchId!)}`);
        if (!churchRes.ok) {
          if (churchRes.status === 404) {
            setChurchNotFound(true);
          } else {
            console.error("Error loading church record:", churchRes.status);
          }
          return;
        }
        const churchData = await churchRes.json();

        // Map snake_case DB fields to camelCase expected by the Church type
        setChurch({
          ...churchData,
          logoUrl: churchData.logo_url ?? churchData.logoUrl ?? null,
          leaderName: churchData.leader_name ?? churchData.leaderName ?? null,
          leaderTitle: churchData.leader_title ?? churchData.leaderTitle ?? null,
          createdAt: churchData.created_at ?? churchData.createdAt ?? null,
          updatedAt: churchData.updated_at ?? churchData.updatedAt ?? null,
        } as Church);

        if (churchData.status === "disabled") {
          return;
        }

        // ---------------------------
        // 2. Members count
        // ---------------------------
        const { count: membersCount } = await supabase
          .from("members")
          .select("id", { count: "exact", head: true })
          .eq("church_id", churchId)
          .neq("status", "Archived");
        setMemberCount(membersCount ?? 0);


        // ---------------------------
        // 3. Upcoming Services
        // ---------------------------
        const todayIso = new Date().toISOString().slice(0, 10);

        const { count: servicesCount } = await supabase
          .from("service_plans")
          .select("id", { count: "exact", head: true })
          .eq("church_id", churchId)
          .gte("date_string", todayIso);
        setServiceCount(servicesCount ?? 0);

        // ---------------------------
        // 4. Events This Week
        // ---------------------------
        const startDateString = startOfWeek.toISOString().slice(0, 10);
        const endDateString = endOfWeek.toISOString().slice(0, 10);

        const { count: eventsCount } = await supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("church_id", churchId)
          .gte("date_string", startDateString)
          .lte("date_string", endDateString);
        setEventCount(eventsCount ?? 0);

        // ---------------------------
        // 5. Attendance This Week
        // ---------------------------
        const startIso = startOfWeek.toISOString().slice(0, 10);
        const endIso = endOfWeek.toISOString().slice(0, 10);

        const { count: presentCount } = await supabase
          .from("attendance")
          .select("id", { count: "exact", head: true })
          .eq("church_id", churchId)
          .gte("date", startIso)
          .lte("date", endIso)
          .eq("attended", true);

        setAttendanceThisWeek(presentCount ?? 0);

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

  if (churchNotFound) {
    return (
      <>
        Church not found or unavailable.
      </>
    );
  }

  if (!church) {
    return (
      <>
        Unable to load church dashboard.
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

  if (church.billingDelinquent) {
    return (
      <main className="flex-1 flex flex-col space-y-6">
        <PageHeader
          title="Church Dashboard"
          subtitle="Subscription payment required"
        />
        <BillingLapsedNotice churchName={church.name} isAdmin={true} />
      </main>
    );
  }

  const isChurchDisabled = church.status === "disabled";
  const statusLabel = isChurchDisabled ? "Disabled" : "Active";
  const accessModeLabel = isReadOnly ? "Read-Only" : "Full Access";
  const quickActions = [
    { href: `/church/${churchId}/attendance`, label: "Attendance", icon: <CalendarCheck className="h-5 w-5 text-amber-500" /> },
    { href: `/church/${churchId}/attendance/history`, label: "Attendance History", icon: <Activity className="h-5 w-5 text-amber-500" /> },
    { href: `/church/${churchId}/contributions`, label: "Contributions", icon: <HandCoins className="h-5 w-5 text-emerald-500" /> },
    { href: `/church/${churchId}/calendar`, label: "Events", icon: <Calendar className="h-5 w-5 text-sky-500" /> },
    { href: `/church/${churchId}/members`, label: "Members", icon: <UserPlus className="h-5 w-5 text-blue-500" /> },
    { href: `/church/${churchId}/reports`, label: "Reports", icon: <FileText className="h-5 w-5 text-orange-500" /> },
    { href: `/church/${churchId}/service-plan`, label: "Service Plans", icon: <CalendarHeart className="h-5 w-5 text-violet-500" /> },
    { href: `/church/${churchId}/music/setlists`, label: "Set Lists", icon: <Music className="h-5 w-5 text-emerald-500" /> },
    { href: `/church/${churchId}/music/songs`, label: "Songs", icon: <Music2 className="h-5 w-5 text-emerald-500" /> },
  ];

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
        <Card className="relative overflow-hidden border border-white/15 bg-gradient-to-br from-black/70 via-black/55 to-black/35 backdrop-blur-xl shadow-[0_14px_40px_rgba(0,0,0,0.28)]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent" />
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
                  <span className="text-xs text-white/65">Site Access</span>
                  <span className="text-xs font-medium text-white/85">{accessModeLabel}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DashboardMetricCard
            title="Members"
            description="Including prospects"
            value={memberCount}
            icon={<Users className="h-4 w-4 text-blue-500" />}
          />
          <DashboardMetricCard
            title="Upcoming Services"
            description="Scheduled from today"
            value={serviceCount}
            icon={<ChurchIcon className="h-4 w-4 text-violet-500" />}
          />
          <DashboardMetricCard
            title="Events This Week"
            description="Monday through Sunday"
            value={eventCount}
            icon={<Calendar className="h-4 w-4 text-sky-500" />}
          />
          <DashboardMetricCard
            title="Attendance This Week"
            description="Monday through Sunday"
            value={attendanceThisWeek}
            icon={<Activity className="h-4 w-4 text-amber-500" />}
          />
        </div>

        {/* Quick Actions */}
        <DashboardIconQuickActionsCard
          title="Quick Access"
          description="Main areas for day-to-day church management."
          actions={quickActions}
        />
      </main>
    </>
  );
}

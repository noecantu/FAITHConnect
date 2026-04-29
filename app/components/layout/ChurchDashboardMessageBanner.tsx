"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Quote, BookOpenText, BellRing } from "lucide-react";
import { useChurchId } from "@/app/hooks/useChurchId";
import { useSettings } from "@/app/hooks/use-settings";
import { useAuth } from "@/app/hooks/useAuth";

type DashboardMessage = {
  enabled?: boolean;
  type?: string;
  title?: string;
  message?: string;
  reference?: string;
  updatedAt?: string;
  visibility?: string;
  startAt?: string | null;
  endAt?: string | null;
};

function normalizeType(type?: string): "quote" | "verse" | "reminder" {
  if (type === "quote" || type === "verse") return type;
  return "reminder";
}

export function ChurchDashboardMessageBanner() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { churchId } = useChurchId();
  const { settings, loading } = useSettings(churchId ?? undefined);

  const isChurchRoute = pathname?.startsWith("/church/");

  const dashboardMessage = useMemo(() => {
    if (!settings || typeof settings !== "object") return null;
    const raw = (settings as Record<string, unknown>).dashboardMessage;
    if (!raw || typeof raw !== "object") return null;
    return raw as DashboardMessage;
  }, [settings]);

  if (!isChurchRoute || loading || !dashboardMessage) return null;

  const title = String(dashboardMessage.title ?? "").trim();
  const message = String(dashboardMessage.message ?? "").trim();
  const reference = String(dashboardMessage.reference ?? "").trim();
  const enabled =
    typeof dashboardMessage.enabled === "boolean"
      ? dashboardMessage.enabled
      : Boolean(title || message || reference);
  const visibility = String(dashboardMessage.visibility ?? "all").trim().toLowerCase();
  const type = normalizeType(String(dashboardMessage.type ?? "").trim().toLowerCase());
  const startAt = dashboardMessage.startAt ? new Date(dashboardMessage.startAt) : null;
  const endAt = dashboardMessage.endAt ? new Date(dashboardMessage.endAt) : null;

  const now = new Date();
  const startsInFuture = Boolean(startAt && !Number.isNaN(startAt.getTime()) && now < startAt);
  const endedInPast = Boolean(endAt && !Number.isNaN(endAt.getTime()) && now > endAt);

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes("Admin");
  const isLeader =
    isAdmin || roles.includes("Pastor") || roles.includes("Minister") || roles.includes("Deacon");
  const isStaff = isLeader || roles.length > 0;

  const visibilityAllowed =
    visibility === "admins"
      ? isAdmin
      : visibility === "leaders"
      ? isLeader
      : visibility === "staff"
      ? isStaff
      : true;

  if (!enabled || !message || startsInFuture || endedInPast || !visibilityAllowed) return null;

  const Icon =
    type === "quote" ? Quote : type === "verse" ? BookOpenText : BellRing;

  const badgeLabel =
    type === "quote" ? "Quote" : type === "verse" ? "Scripture" : "Reminder";

  return (
    <div className="relative overflow-hidden rounded-xl border border-yellow-600/28 bg-gradient-to-br from-yellow-950/44 via-black/56 to-black/45 p-4 backdrop-blur-xl shadow-[0_8px_18px_rgba(202,138,4,0.14),inset_0_1px_0_rgba(202,138,4,0.1)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(202,138,4,0.15),transparent_60%)]" />
      <div className="pointer-events-none absolute -inset-x-12 -top-20 h-40 rotate-6 bg-[linear-gradient(90deg,transparent,rgba(202,138,4,0.12),transparent)] blur-xl animate-pulse" />
      <div className="relative flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-yellow-600/35 bg-yellow-700/16 text-yellow-200/90 shadow-[0_0_8px_rgba(202,138,4,0.16)]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 space-y-1">
          <div className="inline-flex items-center rounded-full border border-yellow-600/32 bg-yellow-700/14 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-yellow-200/90">
            {badgeLabel}
          </div>
          {title && <p className="text-sm font-semibold text-white/90">{title}</p>}
          <p className="whitespace-pre-wrap text-sm leading-6 text-white/80">{message}</p>
          {reference && (
            <p className="text-xs font-medium tracking-wide text-yellow-200/95">{reference}</p>
          )}
          {dashboardMessage.updatedAt && (
            <p className="text-[11px] text-white/45">
              Updated {new Date(dashboardMessage.updatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

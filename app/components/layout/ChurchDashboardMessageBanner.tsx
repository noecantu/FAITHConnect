"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Quote, BookOpenText, BellRing } from "lucide-react";
import { useChurchId } from "@/app/hooks/useChurchId";
import { useSettings } from "@/app/hooks/use-settings";
import { useAuth } from "@/app/hooks/useAuth";

type DashboardMessage = {
  id?: string;
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

function getThemeClasses(type: "quote" | "verse" | "reminder") {
  if (type === "quote") {
    return {
      card:
        "border-purple-600/35 bg-gradient-to-br from-purple-950/44 via-black/56 to-black/45 shadow-[0_8px_18px_rgba(147,51,234,0.14),inset_0_1px_0_rgba(147,51,234,0.1)]",
      glow: "bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.15),transparent_60%)]",
      shimmer:
        "bg-[linear-gradient(90deg,transparent,rgba(147,51,234,0.12),transparent)]",
      icon: "border-purple-600/35 bg-purple-700/16 text-purple-200/90 shadow-[0_0_8px_rgba(147,51,234,0.16)]",
      badge: "border-purple-600/32 bg-purple-700/14 text-purple-200/90",
      reference: "text-purple-200/95",
    };
  }

  if (type === "verse") {
    return {
      card:
        "border-blue-600/35 bg-gradient-to-br from-blue-950/44 via-black/56 to-black/45 shadow-[0_8px_18px_rgba(37,99,235,0.14),inset_0_1px_0_rgba(37,99,235,0.1)]",
      glow: "bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.15),transparent_60%)]",
      shimmer:
        "bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.12),transparent)]",
      icon: "border-blue-600/35 bg-blue-700/16 text-blue-200/90 shadow-[0_0_8px_rgba(37,99,235,0.16)]",
      badge: "border-blue-600/32 bg-blue-700/14 text-blue-200/90",
      reference: "text-blue-200/95",
    };
  }

  return {
    card:
      "border-yellow-600/35 bg-gradient-to-br from-yellow-950/44 via-black/56 to-black/45 shadow-[0_8px_18px_rgba(202,138,4,0.14),inset_0_1px_0_rgba(202,138,4,0.1)]",
    glow: "bg-[radial-gradient(circle_at_top_right,rgba(202,138,4,0.15),transparent_60%)]",
    shimmer:
      "bg-[linear-gradient(90deg,transparent,rgba(202,138,4,0.12),transparent)]",
    icon: "border-yellow-600/35 bg-yellow-700/16 text-yellow-200/90 shadow-[0_0_8px_rgba(202,138,4,0.16)]",
    badge: "border-yellow-600/32 bg-yellow-700/14 text-yellow-200/90",
    reference: "text-yellow-200/95",
  };
}

export function ChurchDashboardMessageBanner() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { churchId } = useChurchId();
  const { settings, loading } = useSettings(churchId ?? undefined);

  const isChurchRoute = pathname?.startsWith("/church/");

  const dashboardMessages = useMemo(() => {
    if (!settings || typeof settings !== "object") return null;
    const rawSettings = settings as Record<string, unknown>;
    const raw = rawSettings.dashboardMessages;

    if (Array.isArray(raw)) {
      return raw.filter((entry): entry is DashboardMessage => Boolean(entry && typeof entry === "object"));
    }

    const legacy = rawSettings.dashboardMessage;
    if (!legacy || typeof legacy !== "object") return null;
    return [legacy as DashboardMessage];
  }, [settings]);

  if (!isChurchRoute || loading || !dashboardMessages?.length) return null;

  const now = new Date();

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes("Admin");
  const isLeader =
    isAdmin || roles.includes("Pastor") || roles.includes("Minister") || roles.includes("Deacon");
  const isStaff = isLeader || roles.length > 0;

  const visibleMessages = dashboardMessages.filter((dashboardMessage) => {
    const title = String(dashboardMessage.title ?? "").trim();
    const message = String(dashboardMessage.message ?? "").trim();
    const reference = String(dashboardMessage.reference ?? "").trim();
    const enabled =
      typeof dashboardMessage.enabled === "boolean"
        ? dashboardMessage.enabled
        : Boolean(title || message || reference);
    const visibility = String(dashboardMessage.visibility ?? "all").trim().toLowerCase();
    const startAt = dashboardMessage.startAt ? new Date(dashboardMessage.startAt) : null;
    const endAt = dashboardMessage.endAt ? new Date(dashboardMessage.endAt) : null;
    const startsInFuture = Boolean(startAt && !Number.isNaN(startAt.getTime()) && now < startAt);
    const endedInPast = Boolean(endAt && !Number.isNaN(endAt.getTime()) && now > endAt);
    const visibilityAllowed =
      visibility === "admins"
        ? isAdmin
        : visibility === "leaders"
        ? isLeader
        : visibility === "staff"
        ? isStaff
        : true;

    return enabled && Boolean(message) && !startsInFuture && !endedInPast && visibilityAllowed;
  });

  if (!visibleMessages.length) return null;

  return (
    <div className="space-y-4">
      {visibleMessages.map((dashboardMessage, index) => {
        const title = String(dashboardMessage.title ?? "").trim();
        const message = String(dashboardMessage.message ?? "").trim();
        const reference = String(dashboardMessage.reference ?? "").trim();
        const type = normalizeType(String(dashboardMessage.type ?? "").trim().toLowerCase());
        const Icon =
          type === "quote" ? Quote : type === "verse" ? BookOpenText : BellRing;
        const badgeLabel =
          type === "quote" ? "Quote" : type === "verse" ? "Scripture" : "Reminder";
        const themeClasses = getThemeClasses(type);

        return (
          <div
            key={dashboardMessage.id ?? `${type}-${title}-${index}`}
            className={`relative overflow-hidden rounded-xl border-4 p-4 backdrop-blur-xl ${themeClasses.card}`}
          >
            <div className={`pointer-events-none absolute inset-0 ${themeClasses.glow}`} />
            <div
              className={`pointer-events-none absolute -inset-x-12 -top-20 h-40 rotate-6 blur-xl animate-pulse ${themeClasses.shimmer}`}
            />
            <div className="relative flex items-start gap-3">
              <span
                className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${themeClasses.icon}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 space-y-1">
                <div
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${themeClasses.badge}`}
                >
                  {badgeLabel}
                </div>
                {title && <p className="text-sm font-semibold text-white/90">{title}</p>}
                <p className="whitespace-pre-wrap text-sm leading-6 text-white/80">{message}</p>
                {reference && (
                  <p className={`text-xs font-medium tracking-wide ${themeClasses.reference}`}>
                    {reference}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

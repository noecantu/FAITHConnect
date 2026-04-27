export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

type WarningItem = {
  id: string;
  source: "events" | "service_plans";
  recordId: string;
  title: string;
  message: string;
  fixable: boolean;
};

type CallerContext = {
  churchId: string;
};

function canManageChurch(params: {
  roles: string[];
  callerChurchId: string | null;
  managedChurchIds: string[];
  targetChurchId: string;
}) {
  const { roles, callerChurchId, managedChurchIds, targetChurchId } = params;

  if (callerChurchId === targetChurchId) return true;
  if (managedChurchIds.includes(targetChurchId)) return true;

  return (
    roles.includes("RootAdmin") ||
    roles.includes("SystemAdmin") ||
    roles.includes("DistrictAdmin") ||
    roles.includes("RegionalAdmin")
  );
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(year, month - 1, day);

  return (
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day
  );
}

function isValidTimeString(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(":").map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

async function requireAuthorizedCaller(
  context: { params: Promise<{ churchId: string }> }
): Promise<CallerContext> {
  const authUser = await getServerUser();
  if (!authUser) {
    throw new Error("Unauthorized");
  }

  const { churchId } = await context.params;
  if (!churchId) {
    throw new Error("Missing churchId");
  }

  const { data: caller } = await adminDb
    .from("users")
    .select("roles, church_id, managed_church_ids")
    .eq("id", authUser.id)
    .single();

  if (!caller) {
    throw new Error("Unauthorized");
  }

  const roles: string[] = Array.isArray(caller.roles) ? caller.roles : [];
  const managedChurchIds: string[] = Array.isArray(caller.managed_church_ids)
    ? caller.managed_church_ids
    : [];

  if (
    !canManageChurch({
      roles,
      callerChurchId: caller.church_id ?? null,
      managedChurchIds,
      targetChurchId: churchId,
    })
  ) {
    throw new Error("Forbidden");
  }

  return { churchId };
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ churchId: string }> }
) {
  try {
    const { churchId } = await requireAuthorizedCaller(context);

    const [eventsResult, servicesResult] = await Promise.all([
      adminDb
        .from("events")
        .select("id, title, date_string")
        .eq("church_id", churchId)
        .order("created_at", { ascending: false })
        .limit(500),
      adminDb
        .from("service_plans")
        .select("id, title, date_string, time_string")
        .eq("church_id", churchId)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const warnings: WarningItem[] = [];

    if (!eventsResult.error) {
      for (const row of eventsResult.data ?? []) {
        const title = typeof row.title === "string" ? row.title : "Untitled event";
        const dateString = typeof row.date_string === "string" ? row.date_string : "";

        if (!isValidDateString(dateString)) {
          warnings.push({
            id: `events:${row.id}`,
            source: "events",
            recordId: row.id,
            title,
            message: `Invalid date_string: ${dateString || "(empty)"}`,
            fixable: false,
          });
        }
      }
    }

    if (!servicesResult.error) {
      for (const row of servicesResult.data ?? []) {
        const title = typeof row.title === "string" ? row.title : "Untitled service plan";
        const dateString = typeof row.date_string === "string" ? row.date_string : "";
        const timeString = typeof row.time_string === "string" ? row.time_string : "";

        if (!isValidDateString(dateString)) {
          warnings.push({
            id: `service_plans:date:${row.id}`,
            source: "service_plans",
            recordId: row.id,
            title,
            message: `Invalid date_string: ${dateString || "(empty)"}`,
            fixable: false,
          });
        }

        if (!isValidTimeString(timeString)) {
          warnings.push({
            id: `service_plans:time:${row.id}`,
            source: "service_plans",
            recordId: row.id,
            title,
            message: `Invalid time_string: ${timeString || "(empty)"}`,
            fixable: true,
          });
        }
      }
    }

    return NextResponse.json({
      status: warnings.length > 0 ? "warning" : "ok",
      checkedAt: new Date().toISOString(),
      warningCount: warnings.length,
      warnings,
      errors: {
        events: eventsResult.error?.message ?? null,
        servicePlans: servicesResult.error?.message ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === "Missing churchId") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ churchId: string }> }
) {
  try {
    const { churchId } = await requireAuthorizedCaller(context);

    const body = await req.json();
    const action = typeof body?.action === "string" ? body.action : null;
    const source = body?.source === "events" || body?.source === "service_plans"
      ? body.source
      : null;
    const recordId = typeof body?.recordId === "string" ? body.recordId : null;

    if (!action || !source || !recordId) {
      return NextResponse.json({ error: "Missing action, source, or recordId" }, { status: 400 });
    }

    if (action === "fix") {
      if (source !== "service_plans") {
        return NextResponse.json({ error: "Auto-fix is only supported for service plans" }, { status: 400 });
      }

      const { error } = await adminDb
        .from("service_plans")
        .update({ time_string: "00:00" })
        .eq("id", recordId)
        .eq("church_id", churchId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "Time value fixed to 00:00" });
    }

    if (action === "delete") {
      const table = source === "events" ? "events" : "service_plans";

      const { error } = await adminDb
        .from(table)
        .delete()
        .eq("id", recordId)
        .eq("church_id", churchId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "Record deleted" });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message === "Missing churchId") {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

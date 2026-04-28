export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

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

export async function POST(req: Request) {
  try {
    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const { data: caller } = await adminDb
      .from("users")
      .select("roles, church_id, managed_church_ids")
      .eq("id", authUser.id)
      .single();

    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles: string[] = Array.isArray(caller.roles) ? caller.roles : [];
    const managedChurchIds: string[] = Array.isArray(caller.managed_church_ids)
      ? caller.managed_church_ids
      : [];

    const body = await req.json();
    const churchId = typeof body?.churchId === "string" ? body.churchId : null;
    const eventId = typeof body?.eventId === "string" ? body.eventId : null;
    const groups = body.groups === undefined ? undefined : normalizeStringArray(body.groups);
    const memberIds = body.memberIds === undefined && body.member_ids === undefined
      ? undefined
      : normalizeStringArray(body.memberIds ?? body.member_ids);
    const visibility = body.visibility === undefined
      ? undefined
      : (body.visibility === "public" ? "public" : "private");

    if (!churchId || !eventId) {
      return NextResponse.json({ error: "Missing churchId or eventId" }, { status: 400 });
    }

    if (!canManageChurch({ roles, callerChurchId: caller.church_id ?? null, managedChurchIds, targetChurchId: churchId })) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const nextVisibility = visibility ?? "private";
    const nextGroups = groups ?? [];
    const nextMemberIds = memberIds ?? [];

    if (nextVisibility === "private" && nextGroups.length === 0 && nextMemberIds.length === 0) {
      return NextResponse.json({ error: "Private events must target at least one group or member" }, { status: 400 });
    }

    if (nextMemberIds.length > 0) {
      const { data: memberRows, error: memberError } = await adminDb
        .from("members")
        .select("id")
        .eq("church_id", churchId)
        .in("id", nextMemberIds);

      if (memberError) {
        return NextResponse.json({ error: memberError.message }, { status: 400 });
      }

      if ((memberRows ?? []).length !== nextMemberIds.length) {
        return NextResponse.json({ error: "One or more selected members do not belong to this church" }, { status: 400 });
      }
    }

    const payload: Record<string, unknown> = {};

    if (body.title !== undefined) payload.title = body.title;
    if (body.dateString !== undefined) payload.date_string = body.dateString;
    if (body.date_string !== undefined) payload.date_string = body.date_string;
    if (body.timeString !== undefined) payload.time_string = body.timeString;
    if (body.time_string !== undefined) payload.time_string = body.time_string;
    if (body.description !== undefined) payload.description = body.description;
    if (body.notes !== undefined) payload.notes = body.notes;
    if (visibility !== undefined) payload.visibility = visibility;
    if (groups !== undefined) payload.groups = groups;
    if (memberIds !== undefined) payload.member_ids = memberIds;

    const { error } = await adminDb
      .from("events")
      .update(payload)
      .eq("id", eventId)
      .eq("church_id", churchId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

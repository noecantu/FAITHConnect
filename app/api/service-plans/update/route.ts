export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

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
    const planId = typeof body?.planId === "string" ? body.planId : null;

    if (!churchId || !planId) {
      return NextResponse.json({ error: "Missing churchId or planId" }, { status: 400 });
    }

    if (!canManageChurch({ roles, callerChurchId: caller.church_id ?? null, managedChurchIds, targetChurchId: churchId })) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload: Record<string, unknown> = {
      updated_at: Date.now(),
    };

    if (body.title !== undefined) payload.title = body.title;
    if (body.dateString !== undefined) payload.date_string = body.dateString;
    if (body.timeString !== undefined) payload.time_string = body.timeString;
    if (body.theme !== undefined) payload.theme = typeof body.theme === "string" && body.theme.trim().length > 0 ? body.theme.trim() : null;
    if (body.scripture !== undefined) payload.scripture = typeof body.scripture === "string" && body.scripture.trim().length > 0 ? body.scripture.trim() : null;
    if (body.scriptureText !== undefined) payload.scripture_text = typeof body.scriptureText === "string" && body.scriptureText.trim().length > 0 ? body.scriptureText.trim() : null;
    if (body.scriptureTranslation !== undefined) payload.scripture_translation = typeof body.scriptureTranslation === "string" && body.scriptureTranslation.trim().length > 0 ? body.scriptureTranslation.trim() : null;
    if (body.notes !== undefined) payload.notes = body.notes;
    if (body.sections !== undefined) payload.sections = body.sections;

    const hasIsPublic = typeof body?.isPublic === "boolean";
    const hasGroups = Array.isArray(body?.groups);
    if (hasIsPublic || hasGroups) {
      let isPublic = hasIsPublic ? Boolean(body.isPublic) : false;
      let groups = hasGroups
        ? body.groups.filter((group: unknown): group is string => typeof group === "string" && group.trim().length > 0)
        : [];

      if (!hasIsPublic) {
        const { data: existing } = await adminDb
          .from("service_plans")
          .select("is_public, groups")
          .eq("id", planId)
          .eq("church_id", churchId)
          .single();

        isPublic = existing?.is_public === true;
        if (!hasGroups) {
          groups = Array.isArray(existing?.groups)
            ? existing.groups.filter((group: unknown): group is string => typeof group === "string" && group.trim().length > 0)
            : [];
        }
      }

      if (!isPublic && groups.length === 0) {
        return NextResponse.json({ error: "Private service plans require at least one group" }, { status: 400 });
      }

      payload.is_public = isPublic;
      payload.groups = isPublic ? [] : groups;
    }

    const { error } = await adminDb
      .from("service_plans")
      .update(payload)
      .eq("id", planId)
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

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
    const song = body?.song as Record<string, unknown> | undefined;

    if (!churchId || !song) {
      return NextResponse.json({ error: "Missing churchId or song payload" }, { status: 400 });
    }

    if (
      !canManageChurch({
        roles,
        callerChurchId: caller.church_id ?? null,
        managedChurchIds,
        targetChurchId: churchId,
      })
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = {
      church_id: churchId,
      title: typeof song.title === "string" ? song.title : "",
      artist: typeof song.artist === "string" && song.artist.length > 0 ? song.artist : null,
      key: typeof song.key === "string" && song.key.length > 0 ? song.key : null,
      tempo: typeof song.tempo === "number" ? song.tempo : null,
      time_sig: typeof song.time_sig === "string" && song.time_sig.length > 0 ? song.time_sig : null,
      lyrics: typeof song.lyrics === "string" && song.lyrics.length > 0 ? song.lyrics : null,
      notes: typeof song.notes === "string" && song.notes.length > 0 ? song.notes : null,
      tags: Array.isArray(song.tags) ? song.tags : [],
    };

    const { data, error } = await adminDb
      .from("songs")
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Failed to create song" }, { status: 400 });
    }

    return NextResponse.json({ song: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
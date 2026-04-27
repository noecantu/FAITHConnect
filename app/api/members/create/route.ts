export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

const RECIPROCAL_TYPES: Record<string, string> = {
  Spouse: "Spouse",
  Parent: "Child",
  Child: "Parent",
  Sibling: "Sibling",
  Guardian: "Ward",
  Ward: "Guardian",
};

type IncomingRelationship = {
  memberIds?: [string, string] | string[];
  member_ids?: [string, string] | string[];
  type?: string;
  anniversary?: string;
};

function getReciprocalType(type: string): string {
  return RECIPROCAL_TYPES[type] || type;
}

function normalizeDateInput(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

function parseRelationships(raw: unknown): Array<{ memberIds: [string, string]; type: string; anniversary?: string }> {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const rel = item as IncomingRelationship;
      const ids = Array.isArray(rel.memberIds)
        ? rel.memberIds
        : Array.isArray(rel.member_ids)
        ? rel.member_ids
        : undefined;
      const type = typeof rel.type === "string" ? rel.type : "";

      if (!Array.isArray(ids) || ids.length < 2 || !ids[0] || !ids[1] || !type) {
        return null;
      }

      const parsed: { memberIds: [string, string]; type: string; anniversary?: string } = {
        memberIds: [String(ids[0]), String(ids[1])],
        type,
      };

      if (typeof rel.anniversary === "string" && rel.anniversary.trim().length > 0) {
        parsed.anniversary = rel.anniversary.trim();
      }

      return parsed;
    })
    .filter((value): value is { memberIds: [string, string]; type: string; anniversary?: string } => Boolean(value));
}

export async function POST(req: Request) {
  try {
    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const callerUid = authUser.id;

    const { data: caller } = await adminDb
      .from("users")
      .select("roles, church_id, managed_church_ids")
      .eq("id", callerUid)
      .single();

    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles: string[] = Array.isArray(caller.roles) ? caller.roles : [];
    const managedChurchIds: string[] = Array.isArray(caller.managed_church_ids)
      ? caller.managed_church_ids
      : [];

    const body = await req.json();
    const churchId: string | null = typeof body?.churchId === "string" ? body.churchId : null;
    const member = body?.member as Record<string, unknown> | undefined;

    if (!churchId || !member) {
      return NextResponse.json({ error: "Missing churchId or member payload" }, { status: 400 });
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

    const memberId = typeof member.id === "string" ? member.id : null;
    if (!memberId) {
      return NextResponse.json({ error: "Missing member id" }, { status: 400 });
    }

    const relationships = parseRelationships(member.relationships);

    const payload: Record<string, unknown> = {
      id: memberId,
      church_id: churchId,
      user_id: typeof member.userId === "string" ? member.userId : null,
      check_in_code: typeof member.checkInCode === "string" ? member.checkInCode : "",
      qr_code: typeof member.qrCode === "string" ? member.qrCode : "",
      first_name: typeof member.firstName === "string" ? member.firstName : "",
      last_name: typeof member.lastName === "string" ? member.lastName : "",
      email: typeof member.email === "string" ? member.email : "",
      phone_number: typeof member.phoneNumber === "string" ? member.phoneNumber : "",
      profile_photo_url: typeof member.profilePhotoUrl === "string" ? member.profilePhotoUrl : "",
      status: typeof member.status === "string" ? member.status : "",
      address: typeof member.address === "object" ? member.address : null,
      birthday: normalizeDateInput(member.birthday),
      baptism_date: normalizeDateInput(member.baptismDate),
      anniversary: normalizeDateInput(member.anniversary),
      family_id: typeof member.familyId === "string" ? member.familyId : null,
      notes: typeof member.notes === "string" ? member.notes : "",
      relationships,
    };

    const { error: insertError } = await adminDb.from("members").insert(payload);
    if (insertError) {
      return NextResponse.json({
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
      }, { status: 400 });
    }

    await Promise.all(
      relationships.map(async (rel) => {
        const relatedId = rel.memberIds[1];
        if (!relatedId) return;

        const { data: relatedRow } = await adminDb
          .from("members")
          .select("id, relationships")
          .eq("id", relatedId)
          .eq("church_id", churchId)
          .single();

        if (!relatedRow) return;

        const existingRels = Array.isArray(relatedRow.relationships)
          ? relatedRow.relationships
          : [];

        const alreadyExists = existingRels.some((r) => {
          const row = r as { memberIds?: [string, string] | string[]; member_ids?: [string, string] | string[] };
          const ids = Array.isArray(row.memberIds)
            ? row.memberIds
            : Array.isArray(row.member_ids)
            ? row.member_ids
            : [];

          return Array.isArray(ids) && ids[1] === memberId;
        });

        if (alreadyExists) return;

        const reciprocal: Record<string, unknown> = {
          memberIds: [relatedId, memberId],
          type: getReciprocalType(rel.type),
        };

        if (rel.anniversary) {
          reciprocal.anniversary = rel.anniversary;
        }

        await adminDb
          .from("members")
          .update({ relationships: [...existingRels, reciprocal] })
          .eq("id", relatedId)
          .eq("church_id", churchId);
      })
    );

    return NextResponse.json({ success: true, id: memberId });
  } catch (err) {
    console.error("members/create error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

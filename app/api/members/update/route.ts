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

type IncomingRelationship = {
  memberIds?: [string, string] | string[];
  member_ids?: [string, string] | string[];
  type?: string;
  anniversary?: string;
};

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
    .filter((v): v is { memberIds: [string, string]; type: string; anniversary?: string } => Boolean(v));
}

function getCounterpartId(
  relationship: { memberIds: [string, string] },
  memberId: string
): string | null {
  const [left, right] = relationship.memberIds;
  if (left === memberId) return right;
  if (right === memberId) return left;
  return null;
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
    const churchId: string | null = typeof body?.churchId === "string" ? body.churchId : null;
    const memberId: string | null = typeof body?.memberId === "string" ? body.memberId : null;
    const data = body?.data as Record<string, unknown> | undefined;

    if (!churchId || !memberId || !data) {
      return NextResponse.json({ error: "Missing churchId, memberId, or data" }, { status: 400 });
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

    // Build update payload (only include fields that are present in data)
    const updatePayload: Record<string, unknown> = {};

    if (data.firstName !== undefined) updatePayload.first_name = data.firstName;
    if (data.lastName !== undefined) updatePayload.last_name = data.lastName;
    if (data.email !== undefined) updatePayload.email = data.email;
    if (data.phoneNumber !== undefined) updatePayload.phone_number = data.phoneNumber;
    if (data.profilePhotoUrl !== undefined) updatePayload.profile_photo_url = data.profilePhotoUrl;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.address !== undefined) updatePayload.address = data.address;
    if (data.birthday !== undefined) updatePayload.birthday = normalizeDateInput(data.birthday);
    if (data.baptismDate !== undefined) updatePayload.baptism_date = normalizeDateInput(data.baptismDate);
    if (data.anniversary !== undefined) updatePayload.anniversary = normalizeDateInput(data.anniversary);
    if (data.familyId !== undefined) updatePayload.family_id = data.familyId;
    if (data.notes !== undefined) updatePayload.notes = data.notes;
    if (data.checkInCode !== undefined) updatePayload.check_in_code = data.checkInCode;
    if (data.qrCode !== undefined) updatePayload.qr_code = data.qrCode;
    if (data.userId !== undefined) updatePayload.user_id = data.userId;

    // If no relationships in payload, do a simple update
    if (data.relationships === undefined) {
      const { error } = await adminDb
        .from("members")
        .update(updatePayload)
        .eq("id", memberId)
        .eq("church_id", churchId);

      if (error) {
        return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    // Relationship sync
    const newRels = parseRelationships(data.relationships);
    updatePayload.relationships = newRels;

    // Get current member's existing relationships
    const { data: currentRow } = await adminDb
      .from("members")
      .select("relationships")
      .eq("id", memberId)
      .eq("church_id", churchId)
      .single();

    const oldRels = parseRelationships(currentRow?.relationships);
    const oldIds = oldRels
      .map((r) => getCounterpartId(r, memberId))
      .filter((id): id is string => Boolean(id));
    const newIds = newRels
      .map((r) => getCounterpartId(r, memberId))
      .filter((id): id is string => Boolean(id));
    const allRelatedIds = Array.from(new Set([...oldIds, ...newIds])).filter(Boolean);

    // Update main member
    const { error: mainError } = await adminDb
      .from("members")
      .update(updatePayload)
      .eq("id", memberId)
      .eq("church_id", churchId);

    if (mainError) {
      return NextResponse.json({ error: mainError.message, code: mainError.code }, { status: 400 });
    }

    // Sync reciprocal relationships
    await Promise.all(
      allRelatedIds.map(async (relatedId) => {
        const { data: relatedRow } = await adminDb
          .from("members")
          .select("id, relationships")
          .eq("id", relatedId)
          .eq("church_id", churchId)
          .single();

        if (!relatedRow) return;

        let relatedRels = parseRelationships(relatedRow.relationships);
        const oldRel = oldRels.find((r) => getCounterpartId(r, memberId) === relatedId);
        const newRel = newRels.find((r) => getCounterpartId(r, memberId) === relatedId);
        const reciprocalExists = relatedRels.some(
          (r) => getCounterpartId(r, relatedId) === memberId
        );
        let changed = false;

        if (newRel && !oldRel) {
          const existingIndex = relatedRels.findIndex(
            (r) => getCounterpartId(r, relatedId) === memberId
          );

          const reciprocal: { memberIds: [string, string]; type: string; anniversary?: string } = {
            memberIds: [relatedId, memberId],
            type: getReciprocalType(newRel.type),
          };
          if (newRel.anniversary) reciprocal.anniversary = newRel.anniversary;

          if (existingIndex >= 0) {
            relatedRels[existingIndex] = reciprocal;
          } else {
            relatedRels.push(reciprocal);
          }
          changed = true;
        } else if (!newRel && oldRel) {
          const len = relatedRels.length;
          relatedRels = relatedRels.filter(
            (r) => getCounterpartId(r, relatedId) !== memberId
          );
          if (relatedRels.length !== len) changed = true;
        } else if (newRel && oldRel) {
          if (!reciprocalExists) {
            const reciprocal: { memberIds: [string, string]; type: string; anniversary?: string } = {
              memberIds: [relatedId, memberId],
              type: getReciprocalType(newRel.type),
            };

            if (newRel.anniversary) reciprocal.anniversary = newRel.anniversary;
            relatedRels.push(reciprocal);
            changed = true;
          }

          if (newRel.type !== oldRel.type || newRel.anniversary !== oldRel.anniversary) {
            const newType = getReciprocalType(newRel.type);
            relatedRels = relatedRels.map((r) => {
              if (getCounterpartId(r, relatedId) === memberId) {
                const updated = { ...r, type: newType };
                if (newRel.anniversary) updated.anniversary = newRel.anniversary;
                else delete updated.anniversary;
                return updated;
              }
              return r;
            });
            changed = true;
          }
        }

        if (changed) {
          await adminDb
            .from("members")
            .update({ relationships: relatedRels })
            .eq("id", relatedId)
            .eq("church_id", churchId);
        }
      })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("members/update error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

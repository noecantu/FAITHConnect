import { getSupabaseClient } from "@/app/lib/supabase/client";
import type { Member, Relationship } from "@/app/lib/types";
import { removeUndefineds } from "@/app/lib/utils";

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

function normalizeDateInput(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function addMember(
  churchId: string,
  data: Partial<Omit<Member, "id">> & { id: string }
) {
  const normalized = removeUndefineds({
    ...data,
    birthday: normalizeDateInput(data.birthday),
    baptismDate: normalizeDateInput(data.baptismDate),
    anniversary: normalizeDateInput(data.anniversary),
  });

  const res = await fetch("/api/members/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      churchId,
      member: normalized,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.error === "string"
        ? body.error
        : `Failed to create member (${res.status})`;
    throw new Error(message);
  }
}

export async function updateMember(
  churchId: string,
  memberId: string,
  data: Partial<Omit<Member, "id">>
) {
  const supabase = getSupabaseClient();

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

  if (data.relationships === undefined) {
    // Simple update — no relationship sync needed
    const { error } = await supabase
      .from("members")
      .update(updatePayload)
      .eq("id", memberId)
      .eq("church_id", churchId);
    if (error) throw error;
    return;
  }

  const newRels = data.relationships;
  updatePayload.relationships = newRels;

  // Get current member for old relationships
  const { data: currentRow } = await supabase
    .from("members")
    .select("relationships")
    .eq("id", memberId)
    .eq("church_id", churchId)
    .single();

  const oldRels: Relationship[] = currentRow?.relationships ?? [];
  const oldIds = oldRels.map((r) => r.memberIds[1]);
  const newIds = newRels.map((r) => r.memberIds[1]);
  const allRelatedIds = Array.from(new Set([...oldIds, ...newIds])).filter(Boolean);

  // Update main member
  const { error } = await supabase
    .from("members")
    .update(updatePayload)
    .eq("id", memberId)
    .eq("church_id", churchId);
  if (error) throw error;

  // Sync reciprocal relationships
  await Promise.all(
    allRelatedIds.map(async (relatedId) => {
      const { data: relatedRow } = await supabase
        .from("members")
        .select("id, relationships")
        .eq("id", relatedId)
        .eq("church_id", churchId)
        .single();

      if (!relatedRow) return;

      let relatedRels: Relationship[] = relatedRow.relationships ?? [];
      const oldRel = oldRels.find((r) => r.memberIds[1] === relatedId);
      const newRel = newRels.find((r) => r.memberIds[1] === relatedId);
      let changed = false;

      if (newRel && !oldRel) {
        const reciprocal: Relationship = {
          memberIds: [relatedId, memberId],
          type: getReciprocalType(newRel.type),
        };
        if (newRel.anniversary) reciprocal.anniversary = newRel.anniversary;
        relatedRels.push(reciprocal);
        changed = true;
      } else if (!newRel && oldRel) {
        const len = relatedRels.length;
        relatedRels = relatedRels.filter((r) => r.memberIds[1] !== memberId);
        if (relatedRels.length !== len) changed = true;
      } else if (newRel && oldRel) {
        if (newRel.type !== oldRel.type || newRel.anniversary !== oldRel.anniversary) {
          const newType = getReciprocalType(newRel.type);
          relatedRels = relatedRels.map((r) => {
            if (r.memberIds[1] === memberId) {
              const updated: Relationship = { ...r, type: newType };
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
        await supabase
          .from("members")
          .update({ relationships: relatedRels })
          .eq("id", relatedId)
          .eq("church_id", churchId);
      }
    })
  );
}

export async function deleteMember(churchId: string, memberId: string) {
  const supabase = getSupabaseClient();

  // Get current member for reciprocal cleanup
  const { data: memberRow } = await supabase
    .from("members")
    .select("relationships")
    .eq("id", memberId)
    .eq("church_id", churchId)
    .single();

  const relationships: Relationship[] = memberRow?.relationships ?? [];
  const relatedIds = relationships.map((r) => r.memberIds[1]).filter(Boolean);

  // Remove reciprocals
  await Promise.all(
    relatedIds.map(async (relatedId) => {
      const { data: relatedRow } = await supabase
        .from("members")
        .select("relationships")
        .eq("id", relatedId)
        .eq("church_id", churchId)
        .single();

      if (!relatedRow) return;

      const existing: Relationship[] = relatedRow.relationships ?? [];
      const updated = existing.filter((r) => r.memberIds[1] !== memberId);
      if (updated.length === existing.length) return;

      await supabase
        .from("members")
        .update({ relationships: updated })
        .eq("id", relatedId)
        .eq("church_id", churchId);
    })
  );

  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", memberId)
    .eq("church_id", churchId);

  if (error) throw error;
}

function parseDate(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return null;
}

export function listenToMembers(
  churchId: string,
  callback: (members: Member[]) => void
): () => void {
  if (!churchId) return () => {};

  getSupabaseClient()
    .from("members")
    .select("*")
    .eq("church_id", churchId)
    .order("last_name", { ascending: true })
    .then(({ data }) => {
      if (!data) return;

      const members: Member[] = data.map((row) => ({
        id: row.id,
        userId: row.user_id ?? null,
        checkInCode: row.check_in_code ?? "",
        qrCode: row.qr_code ?? "",
        firstName: row.first_name ?? "",
        lastName: row.last_name ?? "",
        email: row.email ?? "",
        phoneNumber: row.phone_number ?? "",
        profilePhotoUrl: row.profile_photo_url ?? "",
        status: row.status ?? "",
        address: row.address ?? null,
        birthday: parseDate(row.birthday),
        baptismDate: parseDate(row.baptism_date),
        anniversary: parseDate(row.anniversary),
        familyId: row.family_id ?? null,
        notes: row.notes ?? "",
        relationships: Array.isArray(row.relationships)
          ? row.relationships.map((rel: Record<string, unknown>) => ({
              ...rel,
              memberIds: rel.memberIds as [string, string],
            }))
          : [],
      }));

      callback(members);
    });

  return () => {};
}

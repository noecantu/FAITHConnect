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

function normalizeRelationship(rel: Record<string, unknown>) {
  const idsFromCamel = rel.memberIds;
  const idsFromSnake = rel.member_ids;
  const rawIds = Array.isArray(idsFromCamel)
    ? idsFromCamel
    : Array.isArray(idsFromSnake)
    ? idsFromSnake
    : [];

  const memberIds = rawIds.slice(0, 2).map((id) => String(id)) as [string, string];

  return {
    ...rel,
    memberIds,
  };
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
  const res = await fetch("/api/members/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ churchId, memberId, data }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.error === "string"
        ? body.error
        : `Failed to update member (${res.status})`;
    throw new Error(message);
  }
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
          ? (row.relationships as Record<string, unknown>[])
              .map((rel) => normalizeRelationship(rel))
              .filter((rel): rel is Relationship => Array.isArray(rel.memberIds) && rel.memberIds.length === 2)
          : [],
      }));

      callback(members);
    });

  return () => {};
}

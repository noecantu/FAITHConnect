import os

files = {
    "/Users/noecantu/dev/FAITHConnect/app/lib/members.ts": """import { getSupabaseClient } from "@/app/lib/supabase/client";
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

export async function addMember(
  churchId: string,
  data: Partial<Omit<Member, "id">> & { id: string }
) {
  const supabase = getSupabaseClient();
  const relationships = data.relationships || [];

  // Build member row
  const payload: Record<string, unknown> = removeUndefineds({
    id: data.id,
    church_id: churchId,
    user_id: data.userId ?? null,
    check_in_code: data.checkInCode ?? "",
    qr_code: data.qrCode ?? "",
    first_name: data.firstName ?? "",
    last_name: data.lastName ?? "",
    email: data.email ?? "",
    phone_number: data.phoneNumber ?? "",
    profile_photo_url: data.profilePhotoUrl ?? "",
    status: data.status ?? "",
    address: data.address ?? null,
    birthday: data.birthday ?? null,
    baptism_date: data.baptismDate ?? null,
    anniversary: data.anniversary ?? null,
    family_id: data.familyId ?? null,
    notes: data.notes ?? "",
    relationships: relationships,
  });

  const { error } = await supabase.from("members").insert(payload);
  if (error) throw error;

  // Update reciprocal relationships
  await Promise.all(
    relationships.map(async (rel) => {
      const relatedId = rel.memberIds[1];
      if (!relatedId) return;

      const { data: relatedRow } = await supabase
        .from("members")
        .select("id, relationships")
        .eq("id", relatedId)
        .eq("church_id", churchId)
        .single();

      if (!relatedRow) return;

      const existingRels: Relationship[] = relatedRow.relationships ?? [];
      if (existingRels.some((r) => r.memberIds[1] === data.id)) return;

      const reciprocal: Relationship = {
        memberIds: [relatedId, data.id],
        type: getReciprocalType(rel.type),
      };
      if (rel.anniversary) reciprocal.anniversary = rel.anniversary;

      await supabase
        .from("members")
        .update({ relationships: [...existingRels, reciprocal] })
        .eq("id", relatedId)
        .eq("church_id", churchId);
    })
  );
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
  if (data.birthday !== undefined) updatePayload.birthday = data.birthday;
  if (data.baptismDate !== undefined) updatePayload.baptism_date = data.baptismDate;
  if (data.anniversary !== undefined) updatePayload.anniversary = data.anniversary;
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
""",
    "/Users/noecantu/dev/FAITHConnect/app/lib/songs.ts": """import { getSupabaseClient } from "@/app/lib/supabase/client";
import type { Song } from "./types";

function rowToSong(row: Record<string, unknown>): Song {
  return {
    id: row.id as string,
    churchId: row.church_id as string,
    title: row.title as string,
    artist: (row.artist as string) ?? "",
    key: (row.key as string) ?? "",
    tempo: (row.tempo as string | number) ?? "",
    notes: (row.notes as string) ?? "",
    lyrics: (row.lyrics as string) ?? "",
    tags: (row.tags as string[]) ?? [],
    createdAt: row.created_at ? new Date(row.created_at as string) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at as string) : new Date(),
  } as Song;
}

export function listenToSongs(
  churchId: string | null,
  callback: (songs: Song[]) => void,
  userId?: string
): () => void {
  if (!churchId || !userId) return () => {};

  getSupabaseClient()
    .from("songs")
    .select("*")
    .eq("church_id", churchId)
    .order("title", { ascending: true })
    .then(({ data }) => {
      if (!data) return;
      callback(data.map(rowToSong));
    });

  return () => {};
}

export async function createSong(
  churchId: string,
  data: Omit<Song, "id" | "churchId" | "createdAt" | "updatedAt">
): Promise<Song> {
  const supabase = getSupabaseClient();

  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  const { data: row, error } = await supabase
    .from("songs")
    .insert({ ...cleaned, church_id: churchId })
    .select()
    .single();

  if (error || !row) throw error ?? new Error("Failed to create song");
  return rowToSong(row);
}

export async function getSongs(churchId: string): Promise<Song[]> {
  const { data, error } = await getSupabaseClient()
    .from("songs")
    .select("*")
    .eq("church_id", churchId)
    .order("title", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(rowToSong);
}

export async function updateSong(
  churchId: string,
  songId: string,
  data: Partial<Omit<Song, "id" | "churchId" | "createdAt" | "updatedAt">>
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("songs")
    .update({ ...data })
    .eq("id", songId)
    .eq("church_id", churchId);

  if (error) throw error;
}

export async function deleteSong(churchId: string, songId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("songs")
    .delete()
    .eq("id", songId)
    .eq("church_id", churchId);

  if (error) throw error;
}

export async function getSongById(
  churchId: string,
  songId: string
): Promise<Song | null> {
  const { data, error } = await getSupabaseClient()
    .from("songs")
    .select("*")
    .eq("id", songId)
    .eq("church_id", churchId)
    .single();

  if (error || !data) return null;
  return rowToSong(data);
}
""",
    "/Users/noecantu/dev/FAITHConnect/app/lib/setlists.ts": """import { getSupabaseClient } from "@/app/lib/supabase/client";
import type { SetList, SetListSection } from "./types";
import { nanoid } from "nanoid";
import { fromDateString, toDateTime } from "./date-utils";

function rowToSetList(row: Record<string, unknown>): SetList {
  const dateString = row.date_string as string;
  const timeString = row.time_string as string;

  let sections: SetListSection[] = (row.sections as SetListSection[]) ?? [];

  if ((!sections || sections.length === 0) && row.songs) {
    sections = [
      {
        id: nanoid(),
        title: "Main",
        songs: row.songs as SetListSection["songs"],
      },
    ];
  }

  sections = sections.map((s: Partial<SetListSection> & { name?: string }) => ({
    ...s,
    title: s.title || s.name || "Untitled Section",
  })) as SetListSection[];

  return {
    id: row.id as string,
    churchId: row.church_id as string,
    title: row.title as string,
    dateString,
    timeString,
    date: fromDateString(dateString),
    dateTime: toDateTime(dateString, timeString),
    sections,
    createdBy: row.created_by as string,
    createdAt: row.created_at ? new Date(row.created_at as string).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at as string).getTime() : Date.now(),
    serviceType: (row.service_type as string) ?? null,
    serviceNotes: (row.service_notes as SetList["serviceNotes"]) ?? null,
  };
}

export function listenToSetLists(
  churchId: string,
  callback: (lists: SetList[]) => void,
  userId?: string
): () => void {
  if (!churchId || !userId) return () => {};

  getSupabaseClient()
    .from("setlists")
    .select("*")
    .eq("church_id", churchId)
    .order("date_string", { ascending: false })
    .then(({ data }) => {
      if (!data) return;
      callback(data.map(rowToSetList));
    });

  return () => {};
}

export async function createSetList(
  churchId: string | null,
  data: {
    title: string;
    dateString: string;
    timeString: string;
    sections: SetListSection[];
    createdBy: string;
    serviceType: string | null;
    serviceNotes?: {
      theme?: string | null;
      scripture?: string | null;
      notes?: string | null;
    } | null;
  }
): Promise<SetList> {
  if (!churchId) throw new Error("churchId is required");

  const supabase = getSupabaseClient();

  const { data: row, error } = await supabase
    .from("setlists")
    .insert({
      church_id: churchId,
      title: data.title,
      date_string: data.dateString,
      time_string: data.timeString,
      sections: data.sections,
      created_by: data.createdBy,
      service_type: data.serviceType,
      ...(data.serviceNotes !== undefined && { service_notes: data.serviceNotes }),
    })
    .select()
    .single();

  if (error || !row) throw error ?? new Error("Failed to create set list");
  return rowToSetList(row);
}

export async function updateSetList(
  churchId: string,
  setListId: string,
  data: {
    title?: string;
    dateString?: string;
    timeString?: string;
    sections?: SetListSection[];
    serviceType?: string | null;
    serviceNotes?: {
      theme?: string | null;
      scripture?: string | null;
      notes?: string | null;
    } | null;
  }
): Promise<void> {
  if (!churchId) throw new Error("churchId is required");

  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.dateString !== undefined) payload.date_string = data.dateString;
  if (data.timeString !== undefined) payload.time_string = data.time_string;
  if (data.sections !== undefined) payload.sections = data.sections;
  if (data.serviceType !== undefined) payload.service_type = data.serviceType;
  if (data.serviceNotes !== undefined) payload.service_notes = data.serviceNotes;

  const { error } = await getSupabaseClient()
    .from("setlists")
    .update(payload)
    .eq("id", setListId)
    .eq("church_id", churchId);

  if (error) throw error;
}

export async function deleteSetList(
  churchId: string | null,
  setListId: string,
  router: { push: (path: string) => void }
): Promise<void> {
  if (!churchId) return;

  const { error } = await getSupabaseClient()
    .from("setlists")
    .delete()
    .eq("id", setListId)
    .eq("church_id", churchId);

  if (error) throw error;
  router.push("/music/setlists");
}

export async function getSetListById(
  churchId: string,
  id: string
): Promise<SetList | null> {
  const { data, error } = await getSupabaseClient()
    .from("setlists")
    .select("*")
    .eq("id", id)
    .eq("church_id", churchId)
    .single();

  if (error || !data) return null;
  return rowToSetList(data);
}
""",
    "/Users/noecantu/dev/FAITHConnect/app/lib/attendance.ts": """import { getSupabaseClient } from "@/app/lib/supabase/client";

export async function deleteAttendanceDay(churchId: string, dateString: string) {
  const { error } = await getSupabaseClient()
    .from("attendance")
    .delete()
    .eq("church_id", churchId)
    .eq("date_string", dateString);

  if (error) throw error;
}
""",
    "/Users/noecantu/dev/FAITHConnect/app/lib/deleteMember.ts": """"use client";

import { getSupabaseClient } from "@/app/lib/supabase/client";

export async function deleteMember(
  churchId: string,
  memberId: string,
  router: { push: (path: string) => void },
  toast: (opts: { title: string; description?: string; variant?: string }) => void
) {
  try {
    const supabase = getSupabaseClient();

    // 1. Delete member row (RLS or cascade handles related data)
    const { error } = await supabase
      .from("members")
      .delete()
      .eq("id", memberId)
      .eq("church_id", churchId);

    if (error) throw error;

    // 2. Delete Storage files (photo + QR) — ignore errors for missing files
    const photoPaths = [
      `churches/${churchId}/members/${memberId}/photo.jpg`,
      `churches/${churchId}/members/${memberId}/qr.png`,
    ];

    await Promise.allSettled(
      photoPaths.map((path) =>
        supabase.storage.from("member-photos").remove([path])
      )
    );

    // 3. Toast + redirect
    toast({
      title: "Member deleted",
      description: "The member has been removed.",
    });

    router.push(`/church/${churchId}/members`);
  } catch (error) {
    console.error("Error deleting member:", error);

    toast({
      title: "Error",
      description: "Failed to delete member.",
      variant: "destructive",
    });
  }
}
""",
    "/Users/noecantu/dev/FAITHConnect/app/lib/duplicateSetList.ts": """import { getSupabaseClient } from "@/app/lib/supabase/client";

export async function duplicateSetList(
  churchId: string,
  setListId: string,
  router: { push: (path: string) => void }
) {
  try {
    const supabase = getSupabaseClient();

    // Fetch original
    const { data: original, error: fetchError } = await supabase
      .from("setlists")
      .select("*")
      .eq("id", setListId)
      .eq("church_id", churchId)
      .single();

    if (fetchError || !original) return;

    // Create duplicate
    const { data: newRow, error: insertError } = await supabase
      .from("setlists")
      .insert({
        church_id: churchId,
        title: `${original.title}_Copy`,
        date_string: original.date_string ?? null,
        time_string: original.time_string ?? null,
        service_type: original.service_type ?? null,
        service_notes: original.service_notes ?? "",
        created_by: "system",
        sections: original.sections ?? [],
      })
      .select("id")
      .single();

    if (insertError || !newRow) throw insertError ?? new Error("Insert failed");

    router.push(`/church/${churchId}/music/setlists/${newRow.id}`);
  } catch (err) {
    console.error("Duplicate error:", err);
  }
}
""",
    "/Users/noecantu/dev/FAITHConnect/app/lib/regional-users.ts": """import { getSupabaseClient } from "@/app/lib/supabase/client";

type RegionalUserRecord = {
  uid: string;
  roles?: string[];
  churchId?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePhotoUrl?: string | null;
};

export async function getUsersByChurchIds(churchIds: string[]): Promise<RegionalUserRecord[]> {
  const normalizedChurchIds = Array.from(new Set(churchIds.filter(Boolean)));

  if (normalizedChurchIds.length === 0) return [];

  const { data, error } = await getSupabaseClient()
    .from("users")
    .select("id, roles, church_id, first_name, last_name, email, profile_photo_url")
    .in("church_id", normalizedChurchIds);

  if (error) throw error;

  const users = new Map<string, RegionalUserRecord>();

  (data ?? []).forEach((row) => {
    users.set(row.id, {
      uid: row.id,
      roles: row.roles,
      churchId: row.church_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      profilePhotoUrl: row.profile_photo_url,
    });
  });

  return Array.from(users.values());
}
""",
    "/Users/noecantu/dev/FAITHConnect/app/lib/auth/verifySignupToken.ts": """import { adminDb } from "@/app/lib/supabase/admin";

export async function verifySignupToken(token: string) {
  try {
    const { data, error } = await adminDb
      .from("signup_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !data) {
      return { valid: false, reason: "not_found" };
    }

    // Expiration check
    const now = Date.now();
    const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0;

    if (expiresAt < now) {
      return { valid: false, reason: "expired" };
    }

    // Already used
    if (data.used) {
      return { valid: false, reason: "used" };
    }

    return {
      valid: true,
      planId: data.plan_id,
      customerId: data.customer_id,
      subscriptionId: data.subscription_id,
    };
  } catch (err) {
    console.error("verifySignupToken error:", err);
    return { valid: false, reason: "error" };
  }
}
"""
}

for path, content in files.items():
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(content)
        print(f"SUCCESS: {path}")
    except Exception as e:
        print(f"FAILURE: {path} - {e}")

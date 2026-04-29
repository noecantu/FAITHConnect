import { getSupabaseClient } from "@/app/lib/supabase/client";
import type { SetList, SetListSection } from "./types";
import { nanoid } from "nanoid";
import { fromDateString, toDateTime } from "./date-utils";

async function syncSectionNames(churchId: string, sections: SetListSection[]) {
  const titles = Array.from(
    new Set(
      sections
        .map((section) => section.title.trim())
        .filter((title) => title.length > 0)
    )
  );

  if (titles.length === 0) return;

  const res = await fetch("/api/section-names", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ churchId, titles }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      typeof body?.error === "string"
        ? body.error
        : `Failed to sync section names (${res.status})`
    );
  }
}

function rowToSetList(row: Record<string, unknown>): SetList {
  const dateString = (row.date_string ?? row.date ?? '') as string;
  const timeString = (row.time_string ?? '') as string;

  let sections: SetListSection[] = (row.sections as SetListSection[]) ?? [];

  if ((!sections || sections.length === 0) && row.items) {
    // Legacy flat items → wrap in a single section
    sections = [
      {
        id: nanoid(),
        title: "Main",
        songs: row.items as SetListSection["songs"],
      },
    ];
  }

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
    .order("created_at", { ascending: false })
    .then(({ data, error }) => {
      if (error) { console.error("listenToSetLists error:", error); return; }
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
    createdBy?: string;
    serviceType: string | null;
    serviceNotes?: {
      theme?: string | null;
      scripture?: string | null;
      notes?: string | null;
    } | null;
  }
): Promise<SetList> {
  if (!churchId) throw new Error("churchId is required");

  const res = await fetch("/api/setlists/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      churchId,
      title: data.title,
      dateString: data.dateString,
      timeString: data.timeString,
      sections: data.sections,
      createdBy: data.createdBy,
      serviceType: data.serviceType ?? null,
      serviceNotes: data.serviceNotes ?? null,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof body?.error === "string" ? body.error : `Failed to create set list (${res.status})`);
  }

  await syncSectionNames(churchId, data.sections);
  return rowToSetList(body.row as Record<string, unknown>);
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

  const res = await fetch("/api/setlists/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      churchId,
      setListId,
      ...data,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof body?.error === "string" ? body.error : `Failed to update set list (${res.status})`);
  }

  if (data.sections) {
    await syncSectionNames(churchId, data.sections);
  }
}

export async function deleteSetList(
  churchId: string | null,
  setListId: string
): Promise<void> {
  if (!churchId) {
    throw new Error("churchId is required");
  }

  const res = await fetch("/api/setlists/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ churchId, setListId }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      typeof body?.error === "string"
        ? body.error
        : `Failed to delete set list (${res.status})`
    );
  }
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

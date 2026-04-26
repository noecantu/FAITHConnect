import { getSupabaseClient } from "@/app/lib/supabase/client";
import type { SetList, SetListSection } from "./types";
import { nanoid } from "nanoid";
import { fromDateString, toDateTime } from "./date-utils";

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
      service_type: data.serviceType ?? null,
      service_notes: data.serviceNotes ?? null,
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
  if (data.timeString !== undefined) payload.time_string = data.timeString;
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

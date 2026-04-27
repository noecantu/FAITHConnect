import { getSupabaseClient } from "@/app/lib/supabase/client";
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
    createdBy: (row.created_by as string) ?? "",
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

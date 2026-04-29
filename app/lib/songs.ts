import { getSupabaseClient } from "@/app/lib/supabase/client";
import type { Song, SongInput } from "./types";

function rowToSong(row: Record<string, unknown>): Song {
  return {
    id: row.id as string,
    churchId: row.church_id as string,
    title: row.title as string,
    artist: (row.artist as string) ?? "",
    key: (row.key as string) ?? "",
    bpm: typeof row.tempo === "number" ? row.tempo : undefined,
    timeSignature: (row.time_sig as string) ?? "",
    lyrics: (row.lyrics as string) ?? "",
    chords: (row.notes as string) ?? "",
    tags: (row.tags as string[]) ?? [],
    createdBy: "",
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
  data: SongInput
): Promise<Song> {
  const payload = {
    title: data.title,
    artist: data.artist || null,
    key: data.key || null,
    tempo: data.bpm ?? null,
    time_sig: data.timeSignature || null,
    lyrics: data.lyrics || null,
    notes: data.chords || null,
    tags: data.tags ?? [],
  };

  const res = await fetch("/api/songs/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ churchId, song: payload }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.song) {
    throw new Error(
      typeof body?.error === "string" ? body.error : `Failed to create song (${res.status})`
    );
  }

  return rowToSong(body.song as Record<string, unknown>);
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
  data: Partial<SongInput>
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.artist !== undefined) payload.artist = data.artist || null;
  if (data.key !== undefined) payload.key = data.key || null;
  if (data.bpm !== undefined) payload.tempo = data.bpm ?? null;
  if (data.timeSignature !== undefined) payload.time_sig = data.timeSignature || null;
  if (data.lyrics !== undefined) payload.lyrics = data.lyrics || null;
  if (data.chords !== undefined) payload.notes = data.chords || null;
  if (data.tags !== undefined) payload.tags = data.tags;

  const res = await fetch("/api/songs/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ churchId, songId, song: payload }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      typeof body?.error === "string" ? body.error : `Failed to update song (${res.status})`
    );
  }
}

export async function deleteSong(churchId: string, songId: string): Promise<void> {
  const res = await fetch("/api/songs/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ churchId, songId }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      typeof body?.error === "string" ? body.error : `Failed to delete song (${res.status})`
    );
  }
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

import { nanoid } from "nanoid";
import type { SetListSection, SetListSongEntry } from "../types";

// Generate a unique ID
export function generateId(): string {
  return nanoid();
}

// Ensure a single item has an ID, preserving all other fields
export function ensureId<T extends { id?: string }>(item: T): T {
  return {
    ...item,
    id: item.id ?? generateId(),
  };
}

// Ensure all sections have IDs
export function ensureSectionIds(sections: SetListSection[]): SetListSection[] {
  return sections.map((section) => ({
    ...ensureId(section),
    songs: ensureSongEntryIds(section.songs ?? []),
  }));
}

// Ensure all song entries inside a section have IDs
export function ensureSongEntryIds(
  songs: SetListSongEntry[]
): SetListSongEntry[] {
  return songs.map((song) => ({
    ...song,
    id: song.id ?? generateId(),
  }));
}

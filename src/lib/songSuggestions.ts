import type { SetList, Song } from '@/lib/types';

export function getSuggestedSongs(
  recentSetLists: SetList[],
  allSongs: Song[],
  max = 10
): Song[] {
  const counts = new Map<string, number>();

  for (const list of recentSetLists) {
    for (const entry of list.songs) {
      counts.set(entry.songId, (counts.get(entry.songId) ?? 0) + 1);
    }
  }

  const sortedIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([id]) => id);

  return sortedIds
    .map((id) => allSongs.find((s) => s.id === id))
    .filter((s): s is Song => Boolean(s));
}

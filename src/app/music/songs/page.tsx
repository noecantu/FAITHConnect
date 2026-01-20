'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/page-header';
import { useChurchId } from '@/hooks/useChurchId';
import { useSongs } from '@/hooks/useSongs';
import type { Song } from '@/lib/types';

export default function SongsPage() {
  const churchId = useChurchId();
  const { songs, loading } = useSongs(churchId);

  const [sortBy, setSortBy] = useState<'title' | 'key' | 'bpm' | 'artist'>('title');

  if (!churchId || loading) {
    return (
      <div className="p-6">
        <PageHeader title="Song List" />
        <p className="text-muted-foreground">Loading songs…</p>
      </div>
    );
  }

  // -----------------------------
  // GROUPING LOGIC
  // -----------------------------
  function groupSongs(songs: Song[], sortBy: 'title' | 'key' | 'bpm' | 'artist') {
    return songs.reduce((acc, song) => {
      let groupKey = '';

      if (sortBy === 'title') {
        groupKey = song.title[0]?.toUpperCase() ?? '#';
      } else if (sortBy === 'key') {
        groupKey = song.key || 'Unknown Key';
      } else if (sortBy === 'bpm') {
        groupKey = song.bpm ? `${song.bpm} BPM` : 'No Tempo';
      } else if (sortBy === 'artist') {
        groupKey = song.artist || 'Unknown Artist';
      }

      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(song);
      return acc;
    }, {} as Record<string, Song[]>);
  }

  const grouped = groupSongs(songs, sortBy);

  // -----------------------------
  // SORT GROUP KEYS
  // -----------------------------
  const sortedGroupKeys = Object.keys(grouped).sort((a, b) => {
    if (sortBy === 'bpm') {
      const numA = parseInt(a);
      const numB = parseInt(b);
      return numA - numB;
    }
    return a.localeCompare(b);
  });

  // -----------------------------
  // SUBTITLE TEXT
  // -----------------------------
  const subtitleText =
    sortBy === 'bpm'
      ? 'All available songs sorted by Tempo.'
      : `All available songs sorted by ${sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}.`;

  return (
    <div className="space-y-6">
      <PageHeader title="Song List" subtitle={subtitleText}>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="title">Title</option>
          <option value="artist">Artist</option>
          <option value="key">Key</option>
          <option value="bpm">Tempo</option>
        </select>
      </PageHeader>

      {/* Add New Song button */}
      <div
        className="
          flex flex-col gap-2
          sm:flex-row sm:justify-end sm:items-center
        "
      >
        <Button asChild className="w-full sm:w-auto">
          <Link href="/music/songs/new">Add New Song</Link>
        </Button>
      </div>

      {/* GROUPED SECTIONS */}
      {sortedGroupKeys.map((groupKey) => (
        <Card key={groupKey} className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{groupKey}</h2>
            <Separator />
          </div>

          <div className="max-h-[300px] overflow-y-auto pr-2">
            <ul className="space-y-2">
              {grouped[groupKey]
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((song) => (
                  <li key={song.id}>
                    <Link href={`/music/songs/${song.id}`}>
                      <Card className="p-4 hover:bg-accent cursor-pointer">
                        <h3 className="font-medium">{song.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Key: {song.key || '—'} • Tempo: {song.bpm ?? '—'}
                        </p>
                      </Card>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </Card>
      ))}
    </div>
  );
}

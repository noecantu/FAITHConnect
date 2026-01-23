'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { useChurchId } from '@/hooks/useChurchId';
import { useSongs } from '@/hooks/useSongs';
import type { Song } from '@/lib/types';
import { ChevronLeft } from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';

export default function SongsPage() {
  const churchId = useChurchId();
  const { songs, loading } = useSongs(churchId);
  const { isAdmin, isMusicManager, isMusicMember } = useUserRoles(churchId);
  const canManage = isAdmin || isMusicManager;
  
  const canView = isAdmin || isMusicMember || isMusicManager;
  const canEdit = isAdmin || isMusicManager;
  const canCreate = isAdmin || isMusicManager;
  const canDelete = isAdmin || isMusicManager;

  const [sortBy, setSortBy] = useState<'title' | 'key' | 'bpm' | 'artist'>('title');
  const [search, setSearch] = useState('');

  if (!churchId || loading) {
    return (
      <div className="p-6">
        <PageHeader title="Song List" />
        <p className="text-muted-foreground">Loading songs…</p>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-6">
        <PageHeader title="Songs" />
        <p className="text-muted-foreground">You do not have permission to view songs.</p>
      </div>
    );
  }
  
  // -----------------------------
  // FILTER SONGS BY SEARCH
  // -----------------------------
  const filteredSongs = songs.filter((song) => {
    const q = search.toLowerCase();
    return (
      song.title.toLowerCase().includes(q) ||
      (song.artist ?? '').toLowerCase().includes(q) ||
      (song.key ?? '').toLowerCase().includes(q)
    );
  });

  // -----------------------------
  // GROUPING LOGIC
  // -----------------------------
  function groupSongs(list: Song[], sortBy: 'title' | 'key' | 'bpm' | 'artist') {
    return list.reduce((acc, song) => {
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

  const grouped = groupSongs(filteredSongs, sortBy);

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
      
      {/* HEADER WITH ADD BUTTON */}
      <PageHeader title="Songs" subtitle={subtitleText}>
        <div className="flex items-center gap-2">
          {canManage && (
            <Button asChild>
              <Link href="/music/songs/new">Add New Song</Link>
            </Button>
          )}
        </div>
      </PageHeader>
  
      {/* Sticky Search + Sort Bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full flex items-center gap-2 py-2">
  
          {/* Search */}
          <Input
            className="w-full"
            placeholder="Search songs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
  
          {/* Clear button (now BEFORE Sort) */}
          {search.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setSearch('')}
              className="shrink-0"
            >
              Clear
            </Button>
          )}
  
          {/* Sort */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-sm text-muted-foreground">Sort:</span>
  
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border rounded px-2 py-1 text-sm bg-background"
            >
              <option value="title">Title</option>
              <option value="artist">Artist</option>
              <option value="key">Key</option>
              <option value="bpm">Tempo</option>
            </select>
          </div>
  
        </div>
      </div>
  
      {/* GROUPED SECTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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

    </div>
  );
}
      
'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { Input } from '@/app/components/ui/input';
import { PageHeader } from '@/app/components/page-header';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useSongs } from '@/app/hooks/useSongs';
import type { Song } from '@/app/lib/types';
import { useUserRoles } from '@/app/hooks/useUserRoles';
import { useRouter } from "next/navigation";
import { Fab } from '@/app/components/ui/fab';
import { FileText, Music } from "lucide-react";
import { useSettings } from '@/app/hooks/use-settings';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { useAuth } from '@/app/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

export default function SongsPage() {
  const { churchId } = useChurchId();
  const { songs, loading } = useSongs(churchId);
  const { isAdmin, isMusicManager, isMusicMember } = useUserRoles(churchId);
  const canManage = isAdmin || isMusicManager;
  const canView = isAdmin || isMusicMember || isMusicManager;
  const { user } = useAuth();
  const { settings } = useSettings();
  const savedSort = settings?.songSort ?? "title";
  const [sortBy, setSortBy] = useState<"title" | "artist" | "key" | "bpm">(savedSort);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (settings?.songSort) {
      setSortBy(settings.songSort);
    }
  }, [settings?.songSort]);

  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function handleTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element instanceof HTMLElement) {
      const letter = element.dataset.letter;
      if (letter && groupRefs.current[letter]) {
        groupRefs.current[letter]?.scrollIntoView({ behavior: "smooth" });
      }
    }
  }

  if (!churchId || loading) {
    return (
      <>
        <PageHeader title="Song List" />
        <p className="text-muted-foreground">Loading songs…</p>
      </>
    );
  }

  if (!canView) {
    return (
      <>
        <PageHeader title="Songs" />
        <p className="text-muted-foreground">You do not have permission to view songs.</p>
      </>
    );
  }

  // FILTER
  const filteredSongs = songs.filter((song) => {
    const q = search.toLowerCase();
    return (
      song.title.toLowerCase().includes(q) ||
      (song.artist ?? '').toLowerCase().includes(q) ||
      (song.key ?? '').toLowerCase().includes(q)
    );
  });

  // GROUPING
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

  // SORT GROUP KEYS
  const sortedGroupKeys = Object.keys(grouped).sort((a, b) => {
    if (sortBy === 'bpm') {
      const numA = parseInt(a);
      const numB = parseInt(b);
      return numA - numB;
    }
    return a.localeCompare(b);
  });

  const totalSongs = songs.length;

  const subtitleText = `Total: ${totalSongs} | Sorted by ${
    sortBy === "bpm"
      ? "Tempo"
      : sortBy.charAt(0).toUpperCase() + sortBy.slice(1)
  }`;

  return (
    <div className="space-y-6">

      <PageHeader title="Songs" subtitle={subtitleText}/>

      {/* Sticky Search + Sort Bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-wrap items-center gap-3 py-2 w-full">

          {/* Search */}
          <div className="w-full sm:flex-1 flex items-center gap-3">
            <Input
              className="w-full"
              placeholder="Search songs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search.length > 0 && (
              <Button variant="outline" onClick={() => setSearch('')}>
                Clear
              </Button>
            )}
          </div>

          {/* Sort */}
          <div className="flex w-full gap-3 sm:w-auto sm:ml-auto">
            <Select
              value={sortBy}
              onValueChange={async (newSort) => {
                setSortBy(newSort as "title" | "artist" | "key" | "bpm");

                if (!user) return;
                await updateDoc(doc(db, "users", user.id), {
                  "settings.songSort": newSort,
                });
              }}
            >
              <SelectTrigger className="flex-1 min-w-0 sm:w-[150px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="artist">Artist</SelectItem>
                <SelectItem value="key">Key</SelectItem>
                <SelectItem value="bpm">Tempo</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>

      {/* GROUPED SECTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedGroupKeys.map((groupKey) => (
          <Card
            key={groupKey}
            ref={(el) => {
              groupRefs.current[groupKey] = el;
            }}
            className="p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{groupKey}</h2>
              <span className="text-sm text-muted-foreground">
                Songs: {grouped[groupKey].length}
              </span>
            </div>
            <Separator />

            <div className="max-h-[300px] overflow-y-auto pr-2">
              <ul className="space-y-2">
                {grouped[groupKey]
                  .sort((a, b) => a.title.localeCompare(b.title))
                  .map((song) => (
                    <li key={song.id}>
                      <Link href={`/music/songs/${song.id}`}>
                        <Card className="p-4 hover:bg-accent cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{song.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                Key: {song.key || '—'} • Tempo: {song.bpm ?? '—'} • Signature: {song.timeSignature ?? '—'}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 ml-2">
                              {song.lyrics && (
                                <FileText size={16} className="text-blue-400/40" />
                              )}
                              {song.chords && (
                                <Music size={16} className="text-green-400/40" />
                              )}
                            </div>

                          </div>
                        </Card>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      {canManage && (
        <Fab
          type="add"
          onClick={() => router.push("/music/songs/new")}
        />
      )}

      {/* Alphabet Index */}
      <div
        className="fixed right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 
        bg-background/40 backdrop-blur-sm rounded-full px-1 py-2"
        onTouchMove={handleTouchMove}
      >
        {sortedGroupKeys
          .filter((key) => /^[A-Z]$/.test(key))
          .map((letter) => (
            <button
              key={letter}
              data-letter={letter}
              onClick={() => {
                const el = groupRefs.current[letter];
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="text-xs text-muted-foreground hover:text-foreground px-1"
            >
              {letter}
            </button>
          ))}
      </div>

    </div>
  );
}

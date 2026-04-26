'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Separator } from '@/app/components/ui/separator';
import { PageHeader } from '@/app/components/page-header';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useSongs } from '@/app/hooks/useSongs';
import type { Song } from '@/app/lib/types';
import { usePermissions } from '@/app/hooks/usePermissions';
import { useRouter } from "next/navigation";
import { Fab } from '@/app/components/ui/fab';
import { ChevronRight, FileText, Music2 } from "lucide-react";
import { useSettings } from '@/app/hooks/use-settings';
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { useAuth } from '@/app/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { SearchBar } from '@/app/components/ui/search-bar';
import { Button } from '@/app/components/ui/button';

export default function SongsPage() {
  const supabase = getSupabaseClient();
  const { churchId: church_id } = useChurchId();
  const { songs, loading } = useSongs(church_id);
  const { canManageMusic, canReadMusic, loading: rolesLoading } = usePermissions();
  const canManage = canManageMusic;
  const canView = canReadMusic;
  const { user } = useAuth();
  const { settings } = useSettings(church_id ?? undefined);
  const savedSort = settings?.songSort ?? "title";
  const [sortBy, setSortBy] = useState<"title" | "artist" | "key" | "bpm">(savedSort);
  const [search, setSearch] = useState('');
  const router = useRouter();

  async function saveSongSortPreference(newSort: "title" | "artist" | "key" | "bpm") {
    if (!user?.uid) return;

    const { data: userRow, error: fetchError } = await supabase
      .from("users")
      .select("settings")
      .eq("id", user.uid)
      .maybeSingle();

    if (fetchError) {
      console.error("Error reading user settings:", fetchError);
      return;
    }

    const currentSettings =
      userRow && typeof userRow.settings === "object" && userRow.settings !== null
        ? (userRow.settings as Record<string, unknown>)
        : {};

    const { error: updateError } = await supabase
      .from("users")
      .update({ settings: { ...currentSettings, songSort: newSort } })
      .eq("id", user.uid);

    if (updateError) {
      console.error("Error saving song sort preference:", updateError);
    }
  }

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

  const allSongs = songs ?? [];

  // FILTER
  const filteredSongs = allSongs.filter((song) => {
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

  // GROUP + SORT KEYS
  const { grouped, sortedGroupKeys } = useMemo(() => {
    const groupedSongs = groupSongs(filteredSongs, sortBy);
    const keys = Object.keys(groupedSongs).sort((a, b) => {
      if (sortBy === 'bpm') {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        return numA - numB;
      }
      return a.localeCompare(b);
    });

    return { grouped: groupedSongs, sortedGroupKeys: keys };
  }, [filteredSongs, sortBy]);

  const titleLetters = useMemo(
    () => sortedGroupKeys.filter((key) => /^[A-Z]$/.test(key)),
    [sortedGroupKeys]
  );

  const totalSongs = allSongs.length;
  const hasActiveFilters = search.trim().length > 0;

  const subtitleText = `Showing ${filteredSongs.length} of ${totalSongs} | Sorted by ${
    sortBy === "bpm"
      ? "Tempo"
      : sortBy.charAt(0).toUpperCase() + sortBy.slice(1)
  }`;

  if (!church_id || loading || rolesLoading) {
    return (
      <>
        <PageHeader title="Songs" />
        <p className="text-muted-foreground">Loading…</p>
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

  return (
    <>
      <PageHeader title="Songs" subtitle={subtitleText}/>
      {/* Sticky Search + Sort Bar */}
      <div className="sticky top-0 z-10 py-2">
        <div className="rounded-xl border border-white/20 bg-black/70 p-3 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
          <div className="flex flex-wrap items-center gap-3 w-full">

          {/* Search */}
            <div className="w-full sm:flex-1 flex items-center gap-3">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search Songs..."
              />
            </div>

          {/* Sort */}
            <div className="flex w-full gap-3 sm:w-auto sm:ml-auto">
              <Select
                value={sortBy}
                onValueChange={async (newSort) => {
                  const nextSort = newSort as "title" | "artist" | "key" | "bpm";
                  setSortBy(nextSort);
                  await saveSongSortPreference(nextSort);
                }}
              >
                <SelectTrigger
                  className="
                    w-full sm:w-[150px] h-9
                    bg-black/80 border border-white/20 backdrop-blur-xl
                    text-white/80
                    hover:bg-white/5 hover:border-white/20
                    transition
                  "
                >
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
      </div>

      {/* GROUPED SECTIONS */}
      {sortedGroupKeys.length === 0 ? (
        <Card className="rounded-xl border border-dashed border-white/25 bg-black/35 px-6 py-12 text-center backdrop-blur-xl">
          <div className="mx-auto max-w-lg space-y-3">
            <p className="text-base font-medium text-white/90">
              {allSongs.length === 0 ? 'No songs yet' : 'No songs match your search'}
            </p>
            <p className="text-sm text-white/60">
              {allSongs.length === 0
                ? 'Start your music library by adding your first song.'
                : 'Try a different search term to find songs by title, artist, or key.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/30 bg-white/5 hover:bg-white/10"
                  onClick={() => setSearch('')}
                >
                  Clear Search
                </Button>
              )}
              {canManage && (
                <Button
                  type="button"
                  onClick={() => router.push(`/church/${church_id}/music/songs/new`)}
                >
                  Add Song
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedGroupKeys.map((groupKey, groupIndex) => (
            <Card
              key={groupKey}
              ref={(el) => {
                groupRefs.current[groupKey] = el;
              }}
              style={{ animationDelay: `${groupIndex * 40}ms` }}
              className="relative overflow-hidden p-5 space-y-4 bg-gradient-to-b from-black/80 to-black/60 border-white/20 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.28)] animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%)]" />
              <div className="relative flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">{groupKey}</h2>
                <span className="inline-flex items-center rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-xs text-white/75">
                  {grouped[groupKey].length} {grouped[groupKey].length === 1 ? 'Song' : 'Songs'}
                </span>
              </div>

              <Separator />

              <div className="relative max-h-[320px] overflow-y-auto pr-2">
                <ul className="space-y-2">
                  {grouped[groupKey]
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .map((song) => (
                      <li key={song.id}>
                        <Link href={`/church/${church_id}/music/songs/${song.id}`}>
                          <Card
                            className="group relative p-4 cursor-pointer bg-black/60 backdrop-blur-xl interactive-card interactive-card-focus hover:bg-white/[0.10]"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="font-medium truncate group-hover:text-white transition-colors">{song.title}</h3>
                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-white/70">
                                  <span className="rounded-full border border-white/20 bg-black/35 px-2 py-0.5">Key: {song.key || '—'}</span>
                                  <span className="rounded-full border border-white/20 bg-black/35 px-2 py-0.5">{song.bpm ?? '—'} BPM</span>
                                  <span className="rounded-full border border-white/20 bg-black/35 px-2 py-0.5">{song.timeSignature ?? '—'} Time</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 ml-2">
                                {song.lyrics && (
                                  <FileText size={16} className="text-blue-500/80" />
                                )}
                                {song.chords && (
                                  <Music2 size={16} className="text-emerald-500/80" />
                                )}
                                <ChevronRight size={16} className="text-white/35 group-hover:text-white/70 transition-colors" />
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
      )}

      {canManage && (
        <Fab
          type="add"
          onClick={() => router.push(`/church/${church_id}/music/songs/new`)}
        />
      )}

      {/* Alphabet Index */}
      {sortBy === 'title' && titleLetters.length > 0 && (
        <div
          className="fixed right-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col items-center gap-1 border border-white/20 bg-black/55 backdrop-blur-md rounded-full px-1.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
          onTouchMove={handleTouchMove}
          aria-label="Alphabet index"
        >
          {titleLetters.map((letter) => (
            <button
              key={letter}
              data-letter={letter}
              onClick={() => {
                const el = groupRefs.current[letter];
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="text-[11px] leading-none text-white/60 hover:text-white px-1 transition-colors"
              aria-label={`Jump to ${letter}`}
            >
              {letter}
            </button>
          ))}
        </div>
      )}

    </>
  );
}

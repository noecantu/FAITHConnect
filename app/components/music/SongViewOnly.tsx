//app/components/music/SongViewOnly.tsx
'use client';

import { useEffect, useState } from "react";
import { getSongById } from "@/app/lib/songs";
import FullscreenModal from "./FullscreenModal";
import type { Song } from "@/app/lib/types";
import { useChurchId } from "@/app/hooks/useChurchId";
import { getSectionColor } from "@/app/lib/sectionColors";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { ChevronLeft, Expand, FileText, Loader2, Music2 } from "lucide-react";

export default function SongViewOnly({ songId }: { songId: string }) {
  const { churchId } = useChurchId();
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showChords, setShowChords] = useState(false);
  const params = useSearchParams();
  const setlistId = params.get("setlist");

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadSong = async () => {
      setLoading(true);
      const data = await getSongById(churchId, songId);
      if (!isMounted) return;
      setSong(data);
      setLoading(false);
    };

    loadSong();

    return () => {
      isMounted = false;
    };
  }, [churchId, songId]);

  if (loading) {
    return (
      <Card className="relative overflow-hidden border-white/20 bg-gradient-to-br from-black/90 via-black/75 to-black/60 p-8 shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_34%)]" />
        <div className="relative flex min-h-[260px] flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/60" />
          <div className="space-y-1">
            <p className="text-base font-medium text-white/90">Loading song view</p>
            <p className="text-sm text-white/60">Preparing lyrics, chords, and fullscreen actions.</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!song) {
    return (
      <Card className="border-white/20 bg-black/65 p-8 text-center backdrop-blur-xl shadow-[0_12px_34px_rgba(0,0,0,0.24)]">
        <div className="mx-auto max-w-md space-y-3">
          <p className="text-lg font-medium text-white">Song not found</p>
          <p className="text-sm text-white/60">
            This song could not be loaded for the current church context.
          </p>
          {setlistId && churchId && (
            <Button asChild variant="outline" className="bg-black/70 border-white/20 text-white/80 hover:bg-white/5">
              <Link href={`/church/${churchId}/music/setlists/${setlistId}`}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Set List
              </Link>
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const hasLyrics = Boolean(song.lyrics?.trim());
  const hasChords = Boolean(song.chords?.trim());

  return (
    <div className="relative space-y-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.09),transparent_55%)]" />

      <Card className="relative overflow-hidden border-white/20 bg-gradient-to-br from-black/90 via-black/75 to-black/60 p-6 shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500 sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-white/10" />
        <div className="relative space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/60">
                  Song View
                </div>
                {song.artist && (
                  <div className="inline-flex items-center rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs text-white/65">
                    {song.artist}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
                  {song.title}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
                  Open fullscreen mode for distraction-free reading, or preview lyrics and chords below before presenting.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-white/70">
                <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1">Key: {song.key || '—'}</span>
                <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1">{song.bpm ?? '—'} BPM</span>
                <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1">{song.timeSignature || '—'} Time</span>
              </div>
            </div>

            {setlistId && churchId && (
              <Button asChild variant="outline" className="bg-black/70 border-white/20 text-white/80 hover:bg-white/5 lg:self-start">
                <Link href={`/church/${churchId}/music/setlists/${setlistId}`}>
                  Back to Set List
                </Link>
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => hasLyrics && setShowLyrics(true)}
              disabled={!hasLyrics}
              style={{
                backgroundColor: hasLyrics
                  ? getSectionColor("praise")
                  : "rgba(255,255,255,0.08)",
                opacity: hasLyrics ? 1 : 0.45,
                cursor: hasLyrics ? "pointer" : "not-allowed",
              }}
              className="group relative overflow-hidden rounded-2xl border border-white/20 px-5 py-5 text-left text-white shadow-[0_10px_28px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-[0_14px_32px_rgba(0,0,0,0.26)] disabled:hover:translate-y-0 disabled:hover:bg-transparent"
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%)] opacity-70" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-base font-semibold">
                    <FileText className="h-4 w-4 text-blue-500/80" />
                    Fullscreen Lyrics
                  </div>
                  <p className="text-sm leading-6 text-white/70">
                    Present lyrics cleanly in fullscreen with zoom controls and minimal distraction.
                  </p>
                </div>
                <Expand className="h-4 w-4 shrink-0 text-white/55 transition group-hover:text-white/85" />
              </div>
            </button>

            <button
              onClick={() => hasChords && setShowChords(true)}
              disabled={!hasChords}
              style={{
                backgroundColor: hasChords
                  ? getSectionColor("altarcall")
                  : "rgba(255,255,255,0.08)",
                opacity: hasChords ? 1 : 0.45,
                cursor: hasChords ? "pointer" : "not-allowed",
              }}
              className="group relative overflow-hidden rounded-2xl border border-white/20 px-5 py-5 text-left text-white shadow-[0_10px_28px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-[0_14px_32px_rgba(0,0,0,0.26)] disabled:hover:translate-y-0 disabled:hover:bg-transparent"
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%)] opacity-70" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-base font-semibold">
                    <Music2 className="h-4 w-4 text-emerald-500/90" />
                    Fullscreen Chords
                  </div>
                  <p className="text-sm leading-6 text-white/70">
                    Open chords in a fullscreen reading mode that is easier to scan during rehearsal or service.
                  </p>
                </div>
                <Expand className="h-4 w-4 shrink-0 text-white/55 transition group-hover:text-white/85" />
              </div>
            </button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="relative overflow-hidden border-white/20 bg-black/65 p-6 backdrop-blur-xl shadow-[0_12px_34px_rgba(0,0,0,0.24)] animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:80ms]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%)]" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500/80" />
                <h2 className="text-xl font-medium text-white">Lyrics</h2>
              </div>
              <span className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
                Preview
              </span>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <pre className="max-h-[420px] overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-foreground">
                {hasLyrics ? song.lyrics : "No lyrics provided…"}
              </pre>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-white/20 bg-black/65 p-6 backdrop-blur-xl shadow-[0_12px_34px_rgba(0,0,0,0.24)] animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:140ms]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.08),transparent_35%)]" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Music2 className="h-4 w-4 text-emerald-500/90" />
                <h2 className="text-xl font-medium text-white">Chords</h2>
              </div>
              <span className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55">
                Preview
              </span>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <pre className="max-h-[420px] overflow-y-auto whitespace-pre-wrap text-sm font-mono leading-7 text-foreground">
                {hasChords ? song.chords : "No chords provided…"}
              </pre>
            </div>
          </div>
        </Card>
      </div>

      <FullscreenModal
        open={showLyrics}
        onClose={() => setShowLyrics(false)}
        content={song.lyrics ?? ""}
        title={song.title}
      />

      <FullscreenModal
        open={showChords}
        onClose={() => setShowChords(false)}
        content={song.chords ?? ""}
        title={song.title}
      />
    </div>
  );
}

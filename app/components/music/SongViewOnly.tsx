'use client';

import { useEffect, useState } from "react";
import { getSongById } from "@/app/lib/songs";
import FullscreenModal from "./FullscreenModal";
import type { Song } from "@/app/lib/types";
import { useChurchId } from "@/app/hooks/useChurchId";
import { getSectionColor } from "@/app/lib/sectionColors";
import { DashboardPage } from "@/app/(dashboard)/layout/DashboardPage";

export default function SongViewOnly({ songId }: { songId: string }) {
  const { churchId } = useChurchId();
  const [song, setSong] = useState<Song | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showChords, setShowChords] = useState(false);

  useEffect(() => {
    if (!churchId) return;
    getSongById(churchId, songId).then(setSong);
  }, [churchId, songId]);

  if (!song) return null;

  return (
      <div className="space-y-6">

        {/* Page Title */}
        <h1 className="text-3xl font-semibold">{song.title}</h1>

        {/* Song Metadata */}
        <div className="text-gray-500 flex items-center gap-4">
          <span>Key: {song.key}</span>

          {song.bpm && (
            <>
              <span>|</span>
              <span>BPM: {song.bpm}</span>
            </>
          )}

          {song.timeSignature && (
            <>
              <span>|</span>
              <span>Time: {song.timeSignature}</span>
            </>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => song.lyrics && setShowLyrics(true)}
            disabled={!song.lyrics?.trim()}
            style={{
              backgroundColor: song.lyrics
                ? getSectionColor("praise")
                : "rgba(255,255,255,0.1)",
              opacity: song.lyrics ? 1 : 0.4,
              cursor: song.lyrics ? "pointer" : "not-allowed",
            }}
            className="
              px-4 py-2 rounded
              border border-white/20
              text-white
              backdrop-blur-sm
              transition
              disabled:hover:bg-transparent
              hover:bg-white/10
            "
          >
            Fullscreen Lyrics
          </button>

          <button
            onClick={() => song.chords && setShowChords(true)}
            disabled={!song.chords?.trim()}
            style={{
              backgroundColor: song.chords
                ? getSectionColor("altarcall")
                : "rgba(255,255,255,0.1)",
              opacity: song.chords ? 1 : 0.4,
              cursor: song.chords ? "pointer" : "not-allowed",
            }}
            className="
              px-4 py-2 rounded
              border border-white/20
              text-white
              backdrop-blur-sm
              transition
              disabled:hover:bg-transparent
              hover:bg-white/10
            "
          >
            Fullscreen Chords
          </button>
        </div>

        {/* Lyrics */}
        <section>
          <h2 className="text-xl font-medium mb-2">Lyrics</h2>
          <pre className="whitespace-pre-wrap text-foreground">
            {song.lyrics?.trim() ? song.lyrics : "No lyrics provided…"}
          </pre>
        </section>

        {/* Chords */}
        <section>
          <h2 className="text-xl font-medium mb-2">Chords</h2>
          <pre className="whitespace-pre-wrap text-foreground">
            {song.chords?.trim() ? song.chords : "No chords provided…"}
          </pre>
        </section>

        {/* Modals */}
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

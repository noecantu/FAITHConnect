'use client';

import { useEffect, useState } from "react";
import { getSongById } from "../../lib/songs";
import FullscreenModal from "./FullscreenModal";
import type { Song } from "../../lib/types";
import { useChurchId } from "../../hooks/useChurchId";
import { getSectionColor } from "@/app/lib/sectionColors";

export default function SongViewOnly({ songId }: { songId: string }) {
  const churchId = useChurchId();
  const [song, setSong] = useState<Song | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showChords, setShowChords] = useState(false);

  useEffect(() => {
    if (!churchId) return;
    getSongById(churchId, songId).then(setSong);
  }, [churchId, songId]);

  if (!song) return null;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-semibold">{song.title}</h1>

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

      <div className="flex gap-3">
        <button
          onClick={() => setShowLyrics(true)}
          style={{ backgroundColor: getSectionColor("praise") }}
          className="
            px-4 py-2 rounded
            border border-white/10
            text-white
            hover:bg-white/10
            backdrop-blur-sm
            transition
          "
        >
          Fullscreen Lyrics
        </button>

        <button
          onClick={() => setShowChords(true)}
          style={{ backgroundColor: getSectionColor("altarcall") }}
          className="
            px-4 py-2 rounded
            border border-white/10
            text-white
            hover:bg-white/10
            backdrop-blur-sm
            transition
          "
        >
          Fullscreen Chords
        </button>
      </div>

      <section>
        <h2 className="text-xl font-medium mb-2">Lyrics</h2>
        <pre className="whitespace-pre-wrap text-foreground">
          {song.lyrics?.trim()
            ? song.lyrics
            : "No lyrics provided…"}
        </pre>
      </section>

      <section>
        <h2 className="text-xl font-medium mb-2">Chords</h2>
        <pre className="whitespace-pre-wrap text-foreground">
          {song.chords?.trim()
            ? song.chords
            : "No chords provided…"}
        </pre>
      </section>

    <FullscreenModal
        open={showLyrics}
        onClose={() => setShowLyrics(false)}
        content={song.lyrics ?? ""}
        title={`${song.title}`}
    />

    <FullscreenModal
        open={showChords}
        onClose={() => setShowChords(false)}
        content={song.chords ?? ""}
        title={`${song.title}`}
    />

    </div>
  );
}

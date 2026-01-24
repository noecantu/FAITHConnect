"use client";

import { useEffect, useState } from "react";
import { getSongById } from "@/lib/songs";
import FullscreenModal from "./FullscreenModal";
import type { Song } from "@/lib/types";
import { useChurchId } from "@/hooks/useChurchId";

export default function SongViewOnly({ songId }: { songId: string }) {
  const churchId = useChurchId();               // <-- ADD THIS
  const [song, setSong] = useState<Song | null>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showChords, setShowChords] = useState(false);

  useEffect(() => {
    if (!churchId) return;                      // <-- WAIT FOR CHURCH ID
    getSongById(churchId, songId).then(setSong); // <-- PASS BOTH ARGS
  }, [churchId, songId]);

  if (!song) return null;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-semibold">{song.title}</h1>

      <div className="text-gray-500 space-x-4">
        <span>Key: {song.key}</span>
        <span>BPM: {song.bpm}</span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setShowLyrics(true)}
          className="px-4 py-2 rounded bg-blue-600 text-white"
        >
          Fullscreen Lyrics
        </button>

        <button
          onClick={() => setShowChords(true)}
          className="px-4 py-2 rounded bg-green-600 text-white"
        >
          Fullscreen Chords
        </button>
      </div>

      <section>
        <h2 className="text-xl font-medium mb-2">Lyrics</h2>
        <pre className="whitespace-pre-wrap text-foreground">
          {song.lyrics}
        </pre>
      </section>

      <section>
        <h2 className="text-xl font-medium mb-2">Chords</h2>
        <pre className="whitespace-pre-wrap text-foreground">
          {song.chords}
        </pre>
      </section>

    <FullscreenModal
        open={showLyrics}
        onClose={() => setShowLyrics(false)}
        content={song.lyrics ?? ""}
        title={`${song.title} — Lyrics`}
    />

    <FullscreenModal
        open={showChords}
        onClose={() => setShowChords(false)}
        content={song.chords ?? ""}
        title={`${song.title} — Chords`}
    />

    </div>
  );
}

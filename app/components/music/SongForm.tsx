'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import type { Song } from '@/app/lib/types';

interface SongFormProps {
  mode: 'new' | 'edit';
  initialData?: Song;
  onSave: (data: {
    title: string;
    artist?: string;
    key: string;
    bpm?: number;
    timeSignature?: string;
    lyrics?: string;
    chords?: string;
    tags: string[];
  }) => Promise<void>;  
  saving: boolean;
  onTitleChange?: (title: string) => void;
  focusSection?: 'lyrics' | 'chords';
}

export function SongForm({ initialData, onSave, onTitleChange, focusSection }: SongFormProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('');
  const [bpm, setBpm] = useState('');
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [lyrics, setLyrics] = useState('');
  const [chords, setChords] = useState('');
  const [tags, setTags] = useState('');
  const COMMON_TIME_SIGNATURES = ["1/2", "2/4", "3/4", "4/4", "6/8"];
  const lyricsRef = useRef<HTMLTextAreaElement>(null);
  const chordsRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setArtist(initialData.artist || '');
      setKey(initialData.key || '');
      setBpm(initialData.bpm?.toString() || '');
      setTimeSignature(initialData.timeSignature || '');
      setLyrics(initialData.lyrics || '');
      setChords(initialData.chords || '');
      setTags(initialData.tags?.join(', ') || '');
    }
  }, [initialData]);

  useEffect(() => {
    onTitleChange?.(title);
  }, [onTitleChange, title]);

  useEffect(() => {
    if (!focusSection) return;
    const ref = focusSection === 'lyrics' ? lyricsRef : chordsRef;
    if (!ref.current) return;
    const timer = setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ref.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [focusSection]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    const songData = {
      title: title.trim(),
      artist: artist.trim(),
      key: key.trim(),
      bpm: bpm ? parseInt(bpm) : undefined,
      timeSignature: timeSignature.trim(),
      lyrics: lyrics.trim(),
      chords: chords.trim(),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    await onSave(songData);
  };

  return (
    <Card className="p-6 space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      {/* Artist */}
      <div>
        <label className="block text-sm font-medium mb-1">Artist</label>
        <Input value={artist} onChange={(e) => setArtist(e.target.value)} />
      </div>

      {/* Key + BPM + Time Signature */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Key</label>
          <Input value={key} onChange={(e) => setKey(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">BPM</label>
          <Input
            value={bpm}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*$/.test(val)) {
                setBpm(val);
              }
            }}
            inputMode="numeric"
            pattern="\d*"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Time Signature</label>

          {/* Dropdown */}
          <select
            className="w-full rounded-md border bg-background p-2 text-sm"
            value={COMMON_TIME_SIGNATURES.includes(timeSignature) ? timeSignature : "custom"}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "custom") {
                setTimeSignature(""); // allow typing
              } else {
                setTimeSignature(val);
              }
            }}
          >
            {COMMON_TIME_SIGNATURES.map((sig) => (
              <option key={sig} value={sig}>
                {sig}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>

          {/* Custom Input */}
          {!COMMON_TIME_SIGNATURES.includes(timeSignature) && (
            <Input
              className="mt-2"
              placeholder="Enter custom time signature"
              value={timeSignature}
              onChange={(e) => setTimeSignature(e.target.value)}
            />
          )}
        </div>
      </div>

      {/* Lyrics */}
      <div>
        <label className="block text-sm font-medium mb-1">Lyrics</label>
        <Textarea ref={lyricsRef} value={lyrics} onChange={(e) => setLyrics(e.target.value)} />
      </div>

      {/* Chords */}
      <div>
        <label className="block text-sm font-medium mb-1">Chords</label>
        <Textarea ref={chordsRef} value={chords} onChange={(e) => setChords(e.target.value)} />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
        <Input value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>

      <button
        type="button"
        data-songform-submit
        onClick={handleSubmit}
        className="hidden"
      ></button>

    </Card>
  );
}

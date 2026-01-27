'use client';

import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import type { Song } from '../../lib/types';

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
}

export function SongForm({ mode, initialData, onSave, saving }: SongFormProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('');
  const [bpm, setBpm] = useState('');
  const [timeSignature, setTimeSignature] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [chords, setChords] = useState('');
  const [tags, setTags] = useState('');

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
          <Input value={bpm} onChange={(e) => setBpm(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Time Signature</label>
          <Input value={timeSignature} onChange={(e) => setTimeSignature(e.target.value)} />
        </div>
      </div>

      {/* Lyrics */}
      <div>
        <label className="block text-sm font-medium mb-1">Lyrics</label>
        <Textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} />
      </div>

      {/* Chords */}
      <div>
        <label className="block text-sm font-medium mb-1">Chords</label>
        <Textarea value={chords} onChange={(e) => setChords(e.target.value)} />
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

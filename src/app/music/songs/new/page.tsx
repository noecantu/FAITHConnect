'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChurchId } from '@/hooks/useChurchId';
import { useUserRoles } from '@/hooks/useUserRoles';
import { createSong } from '@/lib/songs';
import type { Song } from '@/lib/types';

export default function NewSongPage() {
  const router = useRouter();
  const churchId = useChurchId();
  const { roles, isAdmin } = useUserRoles(churchId);

  // Form state
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('');
  const [bpm, setBpm] = useState('');
  const [timeSignature, setTimeSignature] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [chords, setChords] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  const canEdit = isAdmin || roles.includes('WorshipLeader');

  if (!churchId) {
    return (
      <div className="p-6">
        <PageHeader title="Add New Song" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-6">
        <PageHeader title="Add New Song" />
        <p className="text-muted-foreground">
          You do not have permission to add songs.
        </p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setSaving(true);

    const newSong: Omit<Song, 'id' | 'createdAt' | 'updatedAt'> = {
      churchId,
      title: title.trim(),
      artist: artist.trim() || undefined,
      key,
      bpm: bpm ? Number(bpm) : undefined,
      timeSignature: timeSignature.trim() || undefined,
      lyrics: lyrics.trim() || undefined,
      chords: chords.trim() || undefined,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      createdBy: 'system',
    };

    const created = await createSong(churchId, newSong);
    router.push(`/music/songs/${created.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Add New Song" />

      <div
        className="
          flex flex-col gap-2
          sm:flex-row sm:justify-end sm:items-center
        "
      >
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={() => router.push('/music/songs')}
        >
          Back to Songs
        </Button>

        <Button
          className="w-full sm:w-auto"
          onClick={() => router.push('/music/songs/new')}
        >
          Add New Song
        </Button>
      </div>

      <Card className="p-6 space-y-8">

        {/* SECTION: Basic Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Basic Info</h2>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Song Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter Title"
            />
          </div>

          {/* Artist */}
          <div>
            <label className="block text-sm font-medium mb-1">Artist</label>
            <Input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Enter Artist Name"
            />
          </div>

          {/* Key / BPM / Time Signature */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Key</label>
              <Input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter Key"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">BPM</label>
              <Input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                placeholder="Tempo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Time Signature</label>
              <Input
                value={timeSignature}
                onChange={(e) => setTimeSignature(e.target.value)}
                placeholder="4/4, 6/8…"
              />
            </div>
          </div>
        </div>

        {/* SECTION: Lyrics */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Lyrics</h2>
          <Textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="Paste lyrics here…"
            className="min-h-[200px]"
          />
        </div>

        {/* SECTION: Chords */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Chords</h2>
          <Textarea
            value={chords}
            onChange={(e) => setChords(e.target.value)}
            placeholder="Paste chord chart or Nashville numbers…"
            className="min-h-[200px] font-mono"
          />
        </div>

        {/* SECTION: Tags */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Tags</h2>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Worship, Upbeat, Shout, etc."
          />
          <p className="text-xs text-muted-foreground">
            Separate tags with commas.
          </p>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving ? 'Saving…' : 'Save Song'}
          </Button>
        </div>

      </Card>
    </div>
  );
}

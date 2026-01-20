'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChurchId } from '@/hooks/useChurchId';
import { useUserRoles } from '@/hooks/useUserRoles';
import { getSongById, updateSong } from '@/lib/songs';
import type { Song } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

export default function EditSongPage() {
  const { id } = useParams();
  const router = useRouter();
  const churchId = useChurchId();
  const { roles, isAdmin } = useUserRoles(churchId);

  const canEdit = isAdmin || roles.includes('WorshipLeader');

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Load song
  useEffect(() => {
    if (!churchId || !id) return;

    const load = async () => {
      const data = await getSongById(churchId, id as string);
      setSong(data);
      setLoading(false);

      if (data) {
        setTitle(data.title);
        setArtist(data.artist ?? '');
        setKey(data.key ?? '');
        setBpm(data.bpm?.toString() ?? '');
        setTimeSignature(data.timeSignature ?? '');
        setLyrics(data.lyrics ?? '');
        setChords(data.chords ?? '');
        setTags(data.tags.join(', '));
      }
    };

    load();
  }, [churchId, id]);

  if (!churchId) {
    return (
      <div className="p-6">
        <PageHeader title="Edit Song" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Edit Song" />
        <p className="text-muted-foreground">Loading song…</p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="p-6">
        <PageHeader title="Edit Song" />
        <p className="text-muted-foreground">Song not found.</p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-6">
        <PageHeader title="Edit Song" />
        <p className="text-muted-foreground">
          You do not have permission to edit songs.
        </p>
      </div>
    );
  }

  // Save handler
  const handleSave = async () => {
    if (!title.trim()) return;

    setSaving(true);

    const updated: Partial<Song> = {
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
      updatedAt: new Date(),
    };

    await updateSong(churchId, song.id, updated);
    router.push(`/music/songs/${song.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Song" />
  
      {/* Back to Songs */}
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
      </div>
  
      {/* SECTION: Basic Info */}
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Basic Info</h2>
          <Separator />
        </div>
  
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Song Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Great Are You Lord"
            />
          </div>
  
          {/* Artist */}
          <div>
            <label className="block text-sm font-medium mb-1">Artist</label>
            <Input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="All Sons & Daughters"
            />
          </div>
  
          {/* Key / BPM / Time Signature */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Key</label>
              <Input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="C"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium mb-1">BPM</label>
              <Input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                placeholder="72"
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
      </Card>
  
      {/* SECTION: Lyrics */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Lyrics</h2>
          <Separator />
        </div>
  
        <div className="max-h-[300px] overflow-y-auto pr-2 bg-black text-white rounded-md p-3">
          <Textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="Paste lyrics here…"
            className="min-h-[200px] bg-black text-white"
          />
        </div>
      </Card>
  
      {/* SECTION: Chords */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Chords</h2>
          <Separator />
        </div>
  
        <div className="max-h-[300px] overflow-y-auto pr-2 bg-black text-white rounded-md p-3">
          <Textarea
            value={chords}
            onChange={(e) => setChords(e.target.value)}
            placeholder="Paste chord chart or Nashville numbers…"
            className="min-h-[200px] font-mono bg-black text-white"
          />
        </div>
      </Card>
  
      {/* SECTION: Tags */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Tags</h2>
          <Separator />
        </div>
  
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="worship, upbeat, easter"
        />
        <p className="text-xs text-muted-foreground">
          Separate tags with commas.
        </p>
      </Card>
  
      {/* SECTION: Actions */}
      <div
        className="
          flex flex-col gap-2
          sm:flex-row sm:justify-end sm:items-center
        "
      >
        <Button
          className="w-full sm:w-auto"
          variant="secondary"
          onClick={() => router.push(`/music/songs/${song.id}`)}
        >
          Cancel
        </Button>
  
        <Button
          className="w-full sm:w-auto"
          onClick={handleSave}
          disabled={saving || !title.trim()}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}  
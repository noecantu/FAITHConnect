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
  const [key, setKey] = useState('C');
  const [bpm, setBpm] = useState('');
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
        setKey(data.key);
        setBpm(data.bpm?.toString() ?? '');
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
      key,
      bpm: bpm ? Number(bpm) : undefined,
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

      <Card className="p-6 space-y-4">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Song Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Great Are You Lord"
          />
        </div>

        {/* Key + BPM */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Default Key</label>
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
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="worship, upbeat, easter"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Separate tags with commas.
          </p>
        </div>

        {/* Save */}
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
      </Card>
    </div>
  );
}

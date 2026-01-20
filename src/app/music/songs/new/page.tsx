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

  // Form state — MUST come before any conditional return
  const [title, setTitle] = useState('');
  const [key, setKey] = useState('C');
  const [bpm, setBpm] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  // Now we can safely check permissions
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
      key,
      bpm: bpm ? Number(bpm) : undefined,
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
        <div className="pt-4">
          <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving ? 'Saving…' : 'Save Song'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

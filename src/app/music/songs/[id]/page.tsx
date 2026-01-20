'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useChurchId } from '@/hooks/useChurchId';
import { useUserRoles } from '@/hooks/useUserRoles';
import { getSongById, deleteSong } from '@/lib/songs';
import { useRecentSetLists } from '@/hooks/useRecentSetLists';
import type { Song, SetList } from '@/lib/types';

export default function SongDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const churchId = useChurchId();
  const { roles, isAdmin } = useUserRoles(churchId);
  const canEdit = isAdmin || roles.includes('WorshipLeader');

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);

  const { lists: recentSetLists } = useRecentSetLists(churchId);

  // Load song
  useEffect(() => {
    if (!churchId || !id) return;

    const load = async () => {
      const data = await getSongById(churchId, id as string);
      setSong(data);
      setLoading(false);
    };

    load();
  }, [churchId, id]);

  if (!churchId) {
    return (
      <div className="p-6">
        <PageHeader title="Song Details" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Song Details" />
        <p className="text-muted-foreground">Loading song…</p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="p-6">
        <PageHeader title="Song Details" />
        <p className="text-muted-foreground">Song not found.</p>
      </div>
    );
  }
  
  // ✅ Now TypeScript knows song is NOT null
  const tags = song.tags ?? [];  

  // Delete handler
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this song?')) return;

    await deleteSong(churchId, song.id);
    router.push('/music/songs');
  };

  // Find recent usage
  const usedIn = recentSetLists.filter((list: SetList) =>
    list.songs.some((s) => s.songId === song.id)
  );

  return (
    <div className="space-y-6">
      <PageHeader title={song.title} />

      {/* Song Info */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-lg">Song Information</h2>
          <p className="text-sm text-muted-foreground">
            Basic details about this song.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Default Key</p>
            <p className="font-medium">{song.key}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">BPM</p>
            <p className="font-medium">{song.bpm ?? '—'}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Tags</p>
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-accent rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No tags</p>
          )}
        </div>

      </Card>

      {/* Recent Usage */}
      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-lg">Recent Usage</h2>

        {usedIn.length === 0 ? (
          <p className="text-muted-foreground">This song has not been used recently.</p>
        ) : (
          <ul className="space-y-2">
            {usedIn.map((list) => (
              <li key={list.id}>
                <Button
                  variant="link"
                  className="p-0"
                  onClick={() => router.push(`/music/setlists/${list.id}`)}
                >
                  {list.title} — {new Date(list.date).toLocaleDateString()}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Actions */}
      {canEdit && (
        <div className="
          flex flex-col gap-2
          sm:flex-row sm:justify-end sm:items-center
        ">
          <Button
            className="w-full sm:w-auto"
            onClick={() => router.push(`/music/songs/${song.id}/edit`)}
          >
            Edit Song
          </Button>

          <Button
            className="w-full sm:w-auto"
            variant="destructive"
            onClick={handleDelete}
          >
            Delete Song
          </Button>
        </div>
      )}

    </div>
  );
}

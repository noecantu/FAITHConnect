'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { getSetListById } from '@/lib/setlists';
import { SetList } from '@/lib/types';
import { useChurchId } from '@/hooks/useChurchId';
import { useUserRoles } from '@/hooks/useUserRoles';
import { format } from 'date-fns';
import { Fab } from '@/components/ui/fab';
import { useRouter } from 'next/navigation';

export default function SetListDetailPage() {
  const { id } = useParams();
  const churchId = useChurchId();
  const router = useRouter();
  const { isAdmin, isMusicManager, isMusicMember } = useUserRoles(churchId);
  const canView = isAdmin || isMusicManager || isMusicMember;
  const canEdit = isAdmin || isMusicManager;

  const [setList, setSetList] = useState<SetList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId || !id) return;

    const load = async () => {
      const data = await getSetListById(churchId, id as string);
      setSetList(data);
      setLoading(false);
    };

    load();
  }, [churchId, id]);

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Set List" />
        <p className="text-muted-foreground">Loading set list…</p>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-6">
        <PageHeader title="Set List" />
        <p className="text-muted-foreground">
          You do not have permission to view this set list.
        </p>
      </div>
    );
  }

  if (!setList) {
    return (
      <div className="p-6">
        <PageHeader title="Set List" />
        <p className="text-muted-foreground">Set List not found.</p>
      </div>
    );
  }

  const formattedDate = format(new Date(setList.date), 'M/d/yy, h:mm a');

  return (
    <div className="space-y-6">
      <PageHeader title={setList.title} subtitle={formattedDate}>
      </PageHeader>

      {/* Sections */}
      <div className="space-y-6">
        {setList.sections.map((section) => (
          <Card key={section.id} className="p-4 space-y-4">
            {/* Section Header */}
            <h2 className="text-lg font-semibold">
              {section.title}{' '}
              <span className="text-muted-foreground text-sm">
                ({section.songs.length}{' '}
                {section.songs.length === 1 ? 'Song' : 'Songs'})
              </span>
            </h2>

            {/* Songs */}
            <div className="space-y-3">
              {section.songs.map((song) => (
                <Card
                  key={song.songId}
                  className="p-3 space-y-2 cursor-pointer hover:bg-accent transition"
                  onClick={() => router.push(`/music/songs/${song.songId}/view`)}
                >
              
                  <p className="font-medium">{song.title}</p>

                  <div className="text-sm text-muted-foreground">
                    Key: {song.key}
                  </div>

                  {song.notes && (
                    <div className="text-sm text-muted-foreground">
                      Notes: {song.notes}
                    </div>
                  )}
                </Card>
              ))}

              {section.songs.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No songs in this section.
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {canEdit && (
        <Fab
          type="edit"
          onClick={() => router.push(`/music/setlists/${setList.id}/edit`)}
        />
      )}

    </div>
  );
}

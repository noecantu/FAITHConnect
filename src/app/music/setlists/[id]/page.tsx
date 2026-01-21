'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSetListById } from '@/lib/setlists';
import { SetList } from '@/lib/types';
import { useChurchId } from '@/hooks/useChurchId';
import { useUserRoles } from '@/hooks/useUserRoles';

export default function SetListDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const churchId = useChurchId();
  const { roles, isAdmin } = useUserRoles(churchId);

  const canEdit = isAdmin || roles.includes('WorshipLeader');

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

  if (!setList) {
    return (
      <div className="p-6">
        <PageHeader title="Set List" />
        <p className="text-muted-foreground">Set List not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={setList.title} />

      {/* Date */}
      <p className="text-muted-foreground">
        {new Date(setList.date).toLocaleDateString()}
      </p>

      {/* Edit Button */}
      {canEdit && (
        <Button
          variant="outline"
          onClick={() => router.push(`/music/setlists/${setList.id}/edit`)}
        >
          Edit Set List
        </Button>
      )}

      {/* Sections */}
      <div className="space-y-6">
        {setList.sections.map((section) => (
          <Card key={section.id} className="p-4 space-y-4">
            {/* Section Header */}
            <div>
              <h2 className="text-lg font-semibold">
                {section.name}{' '}
                <span className="text-muted-foreground text-sm">
                  ({section.songs.length} {section.songs.length === 1 ? 'Song' : 'Songs'})
                </span>
              </h2>
            </div>

            {/* Songs */}
            <div className="space-y-3">
              {section.songs.map((song) => (
                <Card key={song.songId} className="p-3 space-y-2">
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

      {/* Service Notes */}
      {setList.serviceNotes?.notes && (
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold">Service Notes</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {setList.serviceNotes.notes}
          </p>
        </Card>
      )}
    </div>
  );
}

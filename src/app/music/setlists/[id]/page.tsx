'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useChurchId } from '@/hooks/useChurchId';
import { useUserRoles } from '@/hooks/useUserRoles';
import { getSetListById, deleteSetList } from '@/lib/setlists';
import { SetList } from '@/lib/types';

export default function SetListDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const churchId = useChurchId();
  const { roles, isAdmin } = useUserRoles(churchId);

  const canEdit = isAdmin || roles.includes('WorshipLeader');

  const [setList, setSetList] = useState<SetList | null>(null);
  const [loading, setLoading] = useState(true);

  // Load set list
  useEffect(() => {
    if (!churchId || !id) return;

    const load = async () => {
      const data = await getSetListById(churchId, id as string);
      setSetList(data);
      setLoading(false);
    };

    load();
  }, [churchId, id]);

  if (!churchId) {
    return (
      <div className="p-6">
        <PageHeader title="Set List Details" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Set List Details" />
        <p className="text-muted-foreground">Loading set list…</p>
      </div>
    );
  }

  if (!setList) {
    return (
      <div className="p-6">
        <PageHeader title="Set List Details" />
        <p className="text-muted-foreground">Set List not found.</p>
      </div>
    );
  }

  // Delete handler
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this set list?')) return;

    await deleteSetList(churchId, setList.id);
    router.push('/music/setlists');
  };

  return (
    <div className="space-y-6">
      <PageHeader title={setList.title} />

      {/* Basic Info */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-lg">Set List Information</h2>
          <p className="text-sm text-muted-foreground">
            Overview of this service.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="font-medium">
              {new Date(setList.date).toLocaleDateString()}
            </p>
          </div>

          {setList.serviceType && (
            <div>
              <p className="text-xs text-muted-foreground">Service Type</p>
              <p className="font-medium">{setList.serviceType}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Songs */}
      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-lg">Songs</h2>

        {setList.songs.length === 0 ? (
          <p className="text-muted-foreground">No songs in this set list.</p>
        ) : (
          <ul className="space-y-3">
            {setList.songs.map((entry, index) => (
              <li key={index} className="border rounded p-3">
                <p className="font-medium">{entry.title}</p>

                <p className="text-sm text-muted-foreground">
                  Key: {entry.key}
                </p>

                {entry.notes && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Notes: {entry.notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Service Notes */}
      {setList.serviceNotes && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Service Notes</h2>

          {setList.serviceNotes.theme && (
            <div>
              <p className="text-xs text-muted-foreground">Theme</p>
              <p className="font-medium">{setList.serviceNotes.theme}</p>
            </div>
          )}

          {setList.serviceNotes.scripture && (
            <div>
              <p className="text-xs text-muted-foreground">Scripture</p>
              <p className="font-medium">{setList.serviceNotes.scripture}</p>
            </div>
          )}

          {setList.serviceNotes.notes && (
            <div>
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="font-medium whitespace-pre-line">
                {setList.serviceNotes.notes}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Actions */}
      {canEdit && (
        <div
          className="
            flex flex-col gap-2
            sm:flex-row sm:justify-end sm:items-center
          "
        >
          <Button
            className="w-full sm:w-auto"
            onClick={() => router.push(`/music/setlists/${setList.id}/edit`)}
          >
            Edit Set List
          </Button>

          <Button
            className="w-full sm:w-auto"
            variant="destructive"
            onClick={handleDelete}
          >
            Delete Set List
          </Button>
        </div>
      )}
    </div>
  );
}

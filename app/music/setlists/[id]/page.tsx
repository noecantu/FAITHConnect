'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { Card } from '@/app/components/ui/card';
import { deleteSetList, getSetListById } from '@/app/lib/setlists';
import { SetList } from '@/app/lib/types';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useUserRoles } from '@/app/hooks/useUserRoles';
import { format } from 'date-fns';
import { Fab } from '@/app/components/ui/fab';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { Copy, Pencil, Trash } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/alert-dialog';

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

  const formattedDate = format(setList.dateTime, 'M/d/yy, h:mm a');
  const normalize = (str: string) =>
    str.replace(/\s+/g, '').toLowerCase();

  const sectionBgColors: Record<string, string> = {
    praise: "rgba(59, 130, 246, 0.10)",      // Blue
    worship: "rgba(251, 146, 60, 0.10)",     // Orange
    offering: "rgba(239, 68, 68, 0.10)",     // Red
    altarcall: "rgba(34, 197, 94, 0.10)",    // Green
    custom: "rgba(234, 179, 8, 0.10)",       // Yellow
  };

  return (
    <div className="space-y-6">
      <PageHeader title={setList.title} subtitle={formattedDate}>
      </PageHeader>

      {/* Sections */}
      <div className="space-y-6">
        {setList.sections.map((section) => (
          <Card
            key={section.id}
            className="p-4 space-y-4"
            style={{
              backgroundColor:
                sectionBgColors[normalize(section.title)] ?? "transparent",
            }}
          >
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

                  {/* Musical metadata */}
                  <div className="text-sm text-muted-foreground flex gap-2">
                    <span>Key: {song.key}</span>
                    {song.bpm && <span>| BPM: {song.bpm}</span>}
                    {song.timeSignature && <span>| Time: {song.timeSignature}</span>}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Fab type="menu" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align="end"
            className="min-w-0 w-10 bg-white/10 backdrop-blur-sm border border-white/10 p-1"
          >
            {/* Edit */}
            <DropdownMenuItem
              className="flex items-center justify-center p-2"
              onClick={() => router.push(`/music/setlists/${setList.id}/edit`)}
            >
              <Pencil className="h-4 w-4" />
            </DropdownMenuItem>

            {/* Duplicate */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="flex items-center justify-center p-2"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Copy className="h-4 w-4" />
                </DropdownMenuItem>
              </AlertDialogTrigger>

              <AlertDialogContent className="bg-white/10 backdrop-blur-sm border border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle>Duplicate this set list?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A new copy of “{setList.title}” will be created with the same sections and songs.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      // TODO: duplicateSetList()
                    }}
                  >
                    Duplicate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="flex items-center justify-center p-2"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash className="h-4 w-4" />
                </DropdownMenuItem>
              </AlertDialogTrigger>

              <AlertDialogContent className="bg-white/10 backdrop-blur-sm border border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this set list?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently remove “{setList.title}”.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteSetList(churchId, setList.id, router)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

    </div>
  );
}

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
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/components/ui/alert-dialog';
import { getSectionColor } from '@/app/lib/sectionColors';
import { AlertDialogAction, AlertDialogCancel } from '@radix-ui/react-alert-dialog';
import { Button } from '@/app/components/ui/button';
import { duplicateSetList } from '@/app/lib/duplicateSetList';
import { useToast } from '@/app/hooks/use-toast';
import { useAuth } from '@/app/hooks/useAuth';

export default function SetListDetailPage() {
  const { id } = useParams();
  const { churchId } = useChurchId();
  const router = useRouter();
  const { canReadMusic, canManageMusic } = useUserRoles();

  const canView = canReadMusic;
  const canEdit = canManageMusic;
  const { toast } = useToast();
  const { user } = useAuth();

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

  return (
    <div className="space-y-6">
      <PageHeader title={setList.title} subtitle={formattedDate}>
      </PageHeader>

      {/* Overview */}
      {(setList.serviceType ||
        setList.serviceNotes?.theme ||
        setList.serviceNotes?.scripture ||
        setList.serviceNotes?.notes) && (
        <Card className="p-4 space-y-2 bg-black border-white/25">
          <h2 className="text-lg font-semibold">Overview</h2>

          {setList.serviceType && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Service Type:</span> {setList.serviceType}
            </p>
          )}

          {setList.serviceNotes?.theme && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Theme:</span> {setList.serviceNotes.theme}
            </p>
          )}

          {setList.serviceNotes?.scripture && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Scripture:</span> {setList.serviceNotes.scripture}
            </p>
          )}

          {setList.serviceNotes?.notes && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              <span className="font-medium">Notes:</span> {setList.serviceNotes.notes}
            </p>
          )}
        </Card>
      )}

      {/* Sections */}
      <div className="space-y-6">
        {setList.sections.map((section) => (
          <Card
            key={section.id}
            className="p-4 space-y-4"
            style={{
              backgroundColor: getSectionColor(section.title),
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
                  <AlertDialogCancel asChild>
                    <Button variant="outline">
                      Cancel
                    </Button>
                  </AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button
                        variant="default"
                        onClick={() => {
                          if (!churchId) return;
                          duplicateSetList(churchId, setList.id, router, toast, user);
                        }}
                      >
                        Duplicate
                      </Button>
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
                  <AlertDialogCancel asChild>
                    <Button variant="outline">
                      Cancel
                    </Button>
                  </AlertDialogCancel>

                  <AlertDialogAction asChild>
                    <Button
                      variant="destructive"
                      onClick={() => deleteSetList(churchId, setList.id, router)}
                    >
                      Delete
                    </Button>
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
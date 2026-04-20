'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { Card } from '@/app/components/ui/card';
import { deleteSetList, getSetListById } from '@/app/lib/setlists';
import { SetList } from '@/app/lib/types';
import { useChurchId } from '@/app/hooks/useChurchId';
import { usePermissions } from '@/app/hooks/usePermissions';
import { format } from 'date-fns';
import { Fab } from '@/app/components/ui/fab';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { Copy, FileText, Music, Pencil, Trash } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/components/ui/alert-dialog';
import { getSectionColor } from '@/app/lib/sectionColors';
import { AlertDialogAction, AlertDialogCancel } from '@radix-ui/react-alert-dialog';
import { Button } from '@/app/components/ui/button';
import { duplicateSetList } from '@/app/lib/duplicateSetList';
// import { useToast } from '@/app/hooks/use-toast';
// import { useAuth } from '@/app/hooks/useAuth';
import { useSongs } from '@/app/hooks/useSongs';
import { Separator } from '@/app/components/ui/separator';

export default function SetListDetailPage() {
  const { id } = useParams();
  const { churchId } = useChurchId();
  const router = useRouter();
  const { canReadMusic, canManageMusic } = usePermissions();

  const canView = canReadMusic;
  const canEdit = canManageMusic;
  // const { toast } = useToast();
  // const { user } = useAuth();

  const [setList, setSetList] = useState<SetList | null>(null);
  const [loading, setLoading] = useState(true);

  const { songs: allSongs } = useSongs(churchId);

  const songMap = useMemo(() => {
    return Object.fromEntries(allSongs.map((s) => [s.id, s]));
  }, [allSongs]);

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

  const formattedDate = format(setList.dateTime, "M/d/yy, h:mm a");

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title={setList.title} subtitle={formattedDate} />

        <Button asChild variant="outline" className="bg-black/80 border-white/20 text-white/80 hover:bg-white/5">
          <Link href={`/church/${churchId}/music/setlists`}>Back to Set Lists</Link>
        </Button>
      </div>

      {(setList.serviceType ||
        setList.serviceNotes?.theme ||
        setList.serviceNotes?.scripture ||
        setList.serviceNotes?.notes) && (
        <Card className="p-4 space-y-2 bg-black border-white/25">
          <h2 className="text-lg font-semibold">Overview</h2>

          {setList.serviceType && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Service Type:</span>{" "}
              {setList.serviceType}
            </p>
          )}

          {setList.serviceNotes?.theme && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Theme:</span>{" "}
              {setList.serviceNotes.theme}
            </p>
          )}

          {setList.serviceNotes?.scripture && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Scripture:</span>{" "}
              {setList.serviceNotes.scripture}
            </p>
          )}

          {setList.serviceNotes?.notes && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              <span className="font-medium">Notes:</span>{" "}
              {setList.serviceNotes.notes}
            </p>
          )}
        </Card>
      )}

      <div className="space-y-6">
        {setList.sections.map((section) => (
          <Card
            key={section.id}
            className="p-4 space-y-4"
            style={{
              backgroundColor: getSectionColor(section.title),
            }}
          >
            <h2 className="text-lg font-semibold">
              {section.title}{" "}
              <span className="text-muted-foreground text-sm">
                ({section.songs.length}{" "}
                {section.songs.length === 1 ? "Song" : "Songs"})
              </span>
            </h2>

            <Separator className="my-2 bg-white/30" />

            <div className="space-y-3">
              {section.songs.map((song) => {
                const fullSong = songMap[song.songId];

                return (
                  <Card
                    key={song.songId}
                    className="relative p-4 cursor-pointer 
                      bg-black/80 border-white/20 backdrop-blur-xl 
                      hover:bg-black/50 transition"

                    // ⭐ FIXED SONG NAVIGATION
                    onClick={() =>
                      router.push(
                        `/church/${churchId}/music/songs/${song.songId}?setlist=${setList.id}`
                      )
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{song.title}</h3>

                        <p className="text-sm text-muted-foreground">
                          Key: {song.key || "—"} • Tempo:{" "}
                          {song.bpm ?? "—"} • Time Signature:{" "}
                          {song.timeSignature ?? "—"}
                        </p>

                        {song.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Notes: {song.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-2">
                        {fullSong?.lyrics && (
                          <FileText size={16} className="text-blue-400/80" />
                        )}
                        {fullSong?.chords && (
                          <Music size={16} className="text-green-400/80" />
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}

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
            className="min-w-0 w-10 bg-white/10 backdrop-blur-sm border border-white/20 p-1"
          >
            {/* Edit */}
            <DropdownMenuItem
              className="flex items-center justify-center p-2"
              onClick={() =>
                router.push(`/church/${churchId}/music/setlists/${setList.id}/edit`)
              }
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

              <AlertDialogContent className="bg-white/10 backdrop-blur-sm border border-white/20">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Duplicate this set list?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    A new copy of “{setList.title}” will be created with
                    the same sections and songs.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel asChild>
                    <Button variant="outline">Cancel</Button>
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button
                      variant="default"
                      onClick={() => {
                        if (!churchId) return;
                        duplicateSetList(churchId, setList.id, router);
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
                  className="flex items-center justify-center p-2 text-red-400"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash className="h-4 w-4" />
                </DropdownMenuItem>
              </AlertDialogTrigger>

              <AlertDialogContent className="bg-white/10 backdrop-blur-sm border border-white/20">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this set list?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel asChild>
                    <Button variant="outline">Cancel</Button>
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        if (!churchId) return;
                        await deleteSetList(churchId, setList.id, router);
                      }}
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
    </>
  );
}

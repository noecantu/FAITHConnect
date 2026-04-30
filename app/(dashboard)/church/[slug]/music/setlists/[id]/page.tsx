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
import { CalendarDays, ChevronRight, Copy, FileText, Music2, Pencil, Trash } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/components/ui/alert-dialog';
import { getSectionColor } from '@/app/lib/sectionColors';
import { AlertDialogAction, AlertDialogCancel } from '@radix-ui/react-alert-dialog';
import { Button } from '@/app/components/ui/button';
import { duplicateSetList } from '@/app/lib/duplicateSetList';
import { useToast } from '@/app/hooks/use-toast';
// import { useAuth } from '@/app/hooks/useAuth';
import { useSongs } from '@/app/hooks/useSongs';

export default function SetListDetailPage() {
  const { id } = useParams();
  const { churchId } = useChurchId();
  const router = useRouter();
  const { canReadSetlists, canManageSetlists, loading: rolesLoading } = usePermissions();

  const canView = canReadSetlists;
  const canEdit = canManageSetlists;
  const { toast } = useToast();
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

  if (loading || rolesLoading) {
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

  const formattedDate = format(setList.dateTime, "EEEE, MMMM d, yyyy · h:mm a");
  const totalSongs = setList.sections.reduce((acc, s) => acc + s.songs.length, 0);

  return (
    <>
      {/* Hero card */}
      <Card className="relative overflow-hidden border-white/20 bg-gradient-to-br from-black/90 via-black/75 to-black/60 p-6 shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_40%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {setList.serviceType && (
                <span className="inline-flex items-center rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-xs text-white/65 tracking-wide">
                  {setList.serviceType}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-xs text-white/65">
                <Music2 className="h-3 w-3" />
                {totalSongs} {totalSongs === 1 ? "song" : "songs"}
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {setList.title}
            </h1>
            <p className="flex items-center gap-1.5 text-sm text-white/55">
              <CalendarDays className="h-3.5 w-3.5" />
              {formattedDate}
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0 bg-black/60 border-white/20 text-white/75 hover:bg-white/5 hover:text-white/90">
            <Link href={`/church/${churchId}/music/setlists`}>Back to Set Lists</Link>
          </Button>
        </div>
      </Card>

      {/* Service notes */}
      {(setList.serviceNotes?.theme ||
        setList.serviceNotes?.scripture ||
        setList.serviceNotes?.notes) && (
        <Card className="relative overflow-hidden border-white/20 bg-gradient-to-br from-black/80 to-black/60 p-5 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.24)] animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:60ms]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_55%)]" />
          <div className="relative space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Service Notes</p>
            {setList.serviceNotes?.theme && (
              <div className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 w-20 shrink-0 text-xs uppercase tracking-wider text-white/40">Theme</span>
                <span className="text-white/80">{setList.serviceNotes.theme}</span>
              </div>
            )}
            {setList.serviceNotes?.scripture && (
              <div className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 w-20 shrink-0 text-xs uppercase tracking-wider text-white/40">Scripture</span>
                <span className="text-white/80">{setList.serviceNotes.scripture}</span>
              </div>
            )}
            {setList.serviceNotes?.notes && (
              <div className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 w-20 shrink-0 text-xs uppercase tracking-wider text-white/40">Notes</span>
                <p className="whitespace-pre-wrap leading-6 text-white/70">{setList.serviceNotes.notes}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Sections */}
      <div className="space-y-5">
        {setList.sections.map((section, sectionIndex) => {
          const sectionColor = section.color ?? getSectionColor(section.title);
          return (
            <div
              key={section.id}
              className="relative overflow-hidden rounded-xl border border-white/15 bg-black/55 backdrop-blur-xl shadow-[0_8px_28px_rgba(0,0,0,0.26)] animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{
                animationDelay: `${80 + sectionIndex * 50}ms`,
                borderLeftColor: sectionColor,
                borderLeftWidth: "3px",
              }}
            >
              {/* Section header */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: sectionColor }}
              >
                <h2 className="text-sm font-semibold uppercase tracking-wide text-white/90">
                  {section.title}
                </h2>
                <span className="rounded-full border border-white/20 bg-black/30 px-2.5 py-0.5 text-xs text-white/65">
                  {section.songs.length} {section.songs.length === 1 ? "song" : "songs"}
                </span>
              </div>

              {/* Song rows */}
              <div className="divide-y divide-white/[0.06]">
                {section.songs.length === 0 ? (
                  <p className="px-4 py-4 text-sm italic text-white/35">No songs in this section.</p>
                ) : (
                  section.songs.map((song, songIndex) => {
                    const fullSong = songMap[song.songId];
                    return (
                      <div
                        key={song.songId}
                        className="group flex cursor-pointer items-center gap-3 px-4 py-3 rounded-lg transition-all hover:-translate-y-0.5 hover:bg-sky-950/40 hover:shadow-[0_4px_12px_rgba(56,189,248,0.18)] hover:[border-color:rgba(56,189,248,0.5)] border border-transparent"
                        onClick={() =>
                          router.push(`/church/${churchId}/music/songs/${song.songId}/view?setlist=${setList.id}`)
                        }
                      >
                        <span className="w-5 shrink-0 text-center text-xs font-mono text-white/30 tabular-nums">
                          {songIndex + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white/90 transition-colors group-hover:text-white">
                            {song.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full border border-white/15 bg-black/35 px-2 py-0.5 text-[11px] text-white/50">
                              Key: {song.key || "—"}
                            </span>
                            <span className="rounded-full border border-white/15 bg-black/35 px-2 py-0.5 text-[11px] text-white/50">
                              {song.bpm ?? "—"} BPM
                            </span>
                            <span className="rounded-full border border-white/15 bg-black/35 px-2 py-0.5 text-[11px] text-white/50">
                              {song.timeSignature ?? "—"} Time
                            </span>
                          </div>
                          {song.notes && (
                            <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-white/40">
                              {song.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {fullSong?.lyrics && canEdit ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/church/${churchId}/music/songs/${song.songId}/edit?section=lyrics`); }}
                              className="rounded p-1 text-blue-500/70 transition-colors hover:bg-white/10 hover:text-blue-400"
                              title="Edit Lyrics"
                            >
                              <FileText size={14} />
                            </button>
                          ) : fullSong?.lyrics ? (
                            <FileText size={14} className="text-blue-500/60" />
                          ) : null}
                          {fullSong?.chords && canEdit ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/church/${churchId}/music/songs/${song.songId}/edit?section=chords`); }}
                              className="rounded p-1 text-emerald-500/70 transition-colors hover:bg-white/10 hover:text-emerald-400"
                              title="Edit Chords"
                            >
                              <Music2 size={14} />
                            </button>
                          ) : fullSong?.chords ? (
                            <Music2 size={14} className="text-emerald-500/60" />
                          ) : null}
                          <ChevronRight size={14} className="ml-1 text-white/25 transition-colors group-hover:text-white/60" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
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
                  className="flex items-center justify-center p-2 text-red-500"
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
                        try {
                          await deleteSetList(churchId, setList.id);
                          toast({
                            title: 'Set List Deleted',
                            description: `"${setList.title}" has been removed.`,
                          });
                          router.push(`/church/${churchId}/music/setlists`);
                        } catch (error) {
                          toast({
                            title: 'Error',
                            description:
                              error instanceof Error && error.message
                                ? error.message
                                : 'Could not delete set list.',
                            variant: 'destructive',
                          });
                        }
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

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '../../../components/page-header';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { useChurchId } from '../../../hooks/useChurchId';
import { useUserRoles } from '../../../hooks/useUserRoles';
import { getSongById, deleteSong, createSong } from '../../../lib/songs';
import { useRecentSetLists } from '../../../hooks/useRecentSetLists';
import type { Song, SetList } from '../../../lib/types';
import { Separator } from '../../../components/ui/separator';
import { Copy, Pencil, Trash } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../../components/ui/alert-dialog';
import { useToast } from '../../../hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { Fab } from '../../../components/ui/fab';

export default function SongDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const churchId = useChurchId();
  const { roles, isAdmin } = useUserRoles(churchId);
  const canEdit = isAdmin || roles.includes('WorshipLeader');

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);

  const { lists: recentSetLists } = useRecentSetLists(churchId);
  const { toast } = useToast();
  
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
  
  const tags = song.tags ?? [];  

  const handleDelete = async () => {
    if (!churchId) return;
  
    await deleteSong(churchId, song.id);
  
    toast({
      title: "Song deleted",
      description: `"${song.title}" has been removed.`,
    });
  
    router.push('/music/songs');
  };  
  
  const handleDuplicate = async () => {
    if (!song) return;
  
    const duplicateData = {
      title: `${song.title} (Copy)`,
      artist: song.artist || "",
      key: song.key || "",
      bpm: song.bpm,
      timeSignature: song.timeSignature || "",
      lyrics: song.lyrics || "",
      chords: song.chords || "",
      tags: song.tags || [],
      createdBy: "system",
    };
  
    const newSong = await createSong(churchId, duplicateData);
  
    toast({
      title: "Song duplicated",
      description: `"${song.title}" was copied successfully.`,
    });
  
    router.push(`/music/songs/${newSong.id}`);
  };   
  
  // Find recent usage
  const usedIn = recentSetLists.filter((list: SetList) =>
    list.sections.some((section) =>
      section.songs.some((s) => s.songId === song.id)
    )
  );  

  return (
    <div className="space-y-6">
      <PageHeader title={song.title} />
  
      {/* SECTION: Basic Info */}
      <Card className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Song Details</h2>

            <span className="text-xs text-muted-foreground">
              | Last updated:{" "}
              {new Date(song.updatedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <Separator />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Artist</p>
            <p className="font-medium">{song.artist || '—'}</p>
          </div>
  
          <div>
            <p className="text-xs text-muted-foreground">Key</p>
            <p className="font-medium">{song.key || '—'}</p>
          </div>
  
          <div>
            <p className="text-xs text-muted-foreground">BPM</p>
            <p className="font-medium">{song.bpm ?? '—'}</p>
          </div>
  
          <div>
            <p className="text-xs text-muted-foreground">Time Signature</p>
            <p className="font-medium">{song.timeSignature || '—'}</p>
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
  
      {/* SECTION: Lyrics */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Lyrics</h2>
          <Separator />
        </div>
        <div className="max-h-[300px] overflow-y-auto pr-2 bg-black text-white rounded-md p-3">
          {song.lyrics ? (
            <pre className="whitespace-pre-wrap text-sm leading-relaxed">
              {song.lyrics}
            </pre>
          ) : (
            <p className="text-muted-foreground">No lyrics provided.</p>
          )}
        </div>
      </Card>
  
      {/* SECTION: Chords */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Chords</h2>
          <Separator />
        </div>
        <div className="max-h-[300px] overflow-y-auto pr-2 bg-black text-white rounded-md p-3">
          {song.chords ? (
            <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
              {song.chords}
            </pre>
          ) : (
            <p className="text-muted-foreground">No chord chart provided.</p>
          )}
        </div>
      </Card>
  
      {/* SECTION: Recent Usage */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Recent Usage</h2>
          <Separator />
        </div>
  
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

            <DropdownMenuItem
              onClick={() => router.push(`/music/songs/${song.id}/edit`)}
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
            </DropdownMenuItem>

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
                  <AlertDialogTitle>Duplicate this song?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A new copy of “{song.title}” will be created with the same details.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDuplicate}>
                    Duplicate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

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
                  <AlertDialogTitle>Delete this song?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently remove “{song.title}”.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
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
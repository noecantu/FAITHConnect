'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useChurchId } from '@/hooks/useChurchId';
import { useSongs } from '@/hooks/useSongs';

export default function SongsPage() {
  const churchId = useChurchId();
  const { songs, loading } = useSongs(churchId);

  if (!churchId) return <p>Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Songs</h1>

      <Button asChild>
        <Link href="/music/songs/new">Add New Song</Link>
      </Button>

      <div className="grid gap-4 md:grid-cols-2">
        {loading && <p>Loading songs…</p>}

        {!loading &&
          songs.map((song) => (
            <Link key={song.id} href={`/music/songs/${song.id}`}>
              <Card className="p-4 hover:bg-accent cursor-pointer">
                <h2 className="font-semibold">{song.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Default Key: {song.key}
                </p>
              </Card>
            </Link>
          ))}
      </div>
    </div>
  );
}

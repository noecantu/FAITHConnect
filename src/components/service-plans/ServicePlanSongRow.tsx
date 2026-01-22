'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Song } from '@/lib/types';

interface Props {
  song: Song;
  onRemove: () => void;
}

export function ServicePlanSongRow({ song, onRemove }: Props) {
  return (
    <div
      className="
        flex items-center justify-between
        bg-muted/40 border rounded-md px-3 py-2
      "
    >
      <div className="flex flex-col">
        <span className="font-medium">{song.title}</span>
        {song.key && (
          <span className="text-xs text-muted-foreground">
            Key: {song.key}
          </span>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

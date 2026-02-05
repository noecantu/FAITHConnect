'use client';

import { useEffect, useState } from 'react';
import { listenToSongs } from '../lib/songs';
import type { Song } from '../lib/types';

export function useSongs(churchId: string | null) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setSongs([]);
      return;
    }

    setLoading(true);

    const unsubscribe = listenToSongs(
      churchId,
      (list) => {
        setSongs(list);
        setLoading(false);
      },
      "use-songs-hook"
    );

    return () => unsubscribe();
  }, [churchId]);

  return { songs, loading };
}

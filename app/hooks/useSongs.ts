"use client";

import { useEffect, useState } from "react";
import type { Song } from "@/app/lib/types";
import { getSongs } from "@/app/lib/songs"; 

export function useSongs(churchId: string | null) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setSongs([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    (async () => {
      try {
        const list = await getSongs(churchId);
        if (active) setSongs(list);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [churchId]);

  return { songs, loading };
}

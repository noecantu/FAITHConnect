'use client';

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from '../lib/firebase';
import type { Church } from "../lib/types";

export function useChurch(churchId: string | null) {
  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    if (!churchId) {
      setChurch(null);
      setLoading(false);
      return () => { isActive = false };
    }

    const load = async () => {
      try {
        const ref = doc(db, "churches", churchId);
        const snap = await getDoc(ref);

        if (!isActive) return;

        if (snap.exists()) {
          setChurch({ id: snap.id, ...snap.data() } as Church);
        } else {
          setChurch(null);
        }
      } catch (err) {
        if (isActive) {
          console.error("Error loading church:", err);
          setChurch(null);
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [churchId]);

  return { church, loading };
}

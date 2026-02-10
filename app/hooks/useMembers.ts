'use client';

import { useEffect, useState } from 'react';
import { listenToMembers as listenToMembersFromLib } from '../lib/members';
import type { Member } from '../lib/types';

export function useMembers(churchId: string | null) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Effect 1 — handle synchronous state resets (React-approved)
  useEffect(() => {
    if (!churchId) {
      setMembers([]);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [churchId]);

  // Effect 2 — Firestore subscription only (no synchronous setState)
  useEffect(() => {
    if (!churchId) return;

    const unsubscribe = listenToMembersFromLib(churchId, (data) => {
      setMembers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [churchId]);

  return { members, loading };
}

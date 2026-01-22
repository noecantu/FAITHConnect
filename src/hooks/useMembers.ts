'use client';

import { useEffect, useState } from 'react';
import { listenToMembers } from '@/lib/members';
import type { Member } from '@/lib/types';

export function useMembers(churchId: string | null) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setMembers([]);
      return;
    }

    setLoading(true);

    const unsubscribe = listenToMembers(churchId, (list) => {
      setMembers(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [churchId]);

  return { members, loading };
}

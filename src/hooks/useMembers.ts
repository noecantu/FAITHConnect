'use client';

import { useEffect, useState } from 'react';
import { listenToMembers as listenToMembersFromLib } from '@/lib/members';
import type { Member } from '@/lib/types';

export function useMembers(churchId: string | null) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    const unsubscribe = listenToMembersFromLib(churchId, (data) => {
      setMembers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [churchId]);

  return { members, loading };
}

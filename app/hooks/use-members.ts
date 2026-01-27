'use client';

import { useEffect, useState } from 'react';
import { listenToMembers } from '../lib/members';
import type { Member } from '../lib/types';
import { useChurchId } from './useChurchId';

export function useMembers() {
  const churchId = useChurchId();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) return;

    const unsubscribe = listenToMembers(churchId, (data) => {
      setMembers(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [churchId]);

  return { members, loading };
}

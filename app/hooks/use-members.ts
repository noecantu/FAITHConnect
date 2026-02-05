'use client';

import { useEffect, useState } from 'react';
import { listenToMembers } from '../lib/members';
import type { Member } from '../lib/types';
import { useChurchId } from './useChurchId';
import { useAuth } from './useAuth';

export function useMembers() {
  const churchId = useChurchId();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId || !user?.id) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const unsubscribe = listenToMembers(
      churchId,
      (data) => {
        setMembers(data);
        setLoading(false);
      },
      user.id
    );

    return () => unsubscribe();
  }, [churchId, user?.id]);

  return { members, loading };
}


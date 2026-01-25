'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useChurchId } from '@/hooks/useChurchId';
import type { ServicePlan } from '@/lib/types';

export function useServicePlan(id?: string) {
  const churchId = useChurchId();
  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId || !id) return;

    const ref = doc(db, 'churches', churchId, 'servicePlans', id);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setPlan({ id: snap.id, ...snap.data() } as ServicePlan);
      } else {
        setPlan(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [churchId, id]);

  return { plan, loading };
}

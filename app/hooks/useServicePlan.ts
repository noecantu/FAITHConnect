'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useChurchId } from './useChurchId';
import type { ServicePlan } from '../lib/types';
import { useAuth } from './useAuth';

export function useServicePlan(id?: string) {
  const churchId = useChurchId();
  const { user } = useAuth();
  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId || !id || !user?.id) {
      setPlan(null);
      setLoading(false);
      return;
    }

    const ref = doc(db, 'churches', churchId, 'servicePlans', id);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setPlan({ id: snap.id, ...snap.data() } as ServicePlan);
        } else {
          setPlan(null);
        }
        setLoading(false);
      },
      (error) => {
        // Swallow the expected logout error
        if (error.code !== 'permission-denied') {
          console.error('useServicePlan listener error:', error);
        }
      }
    );

    return () => unsub();
  }, [churchId, id, user?.id]);

  return { plan, loading };
}


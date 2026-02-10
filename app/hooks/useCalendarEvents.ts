'use client';

import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import type { Event as EventType } from '../lib/types';

export function useCalendarEvents(churchId: string | null, userId: string | null) {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId || !userId) return;

    const q = query(
      collection(db, 'churches', churchId, 'events'),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: EventType[] = snapshot.docs.map((docSnap) => {
          const raw = docSnap.data();
          return {
            id: docSnap.id,
            title: raw.title,
            description: raw.description,
            date: raw.date?.toDate?.() ?? new Date(),
          };
        });

        setEvents(data);
        setLoading(false);
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          console.error('Events listener error:', error);
        }
      }
    );

    return () => unsubscribe();
  }, [churchId, userId]);

  return { events, loading };
}

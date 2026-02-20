'use client';

import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
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
          const date =
            raw.date instanceof Timestamp
              ? raw.date.toDate()
              : new Date(raw.date ?? Date.now());

          return {
            id: docSnap.id,
            title: raw.title,
            dateString: date.toISOString().slice(0, 10),
            description: raw.description,
            date,
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

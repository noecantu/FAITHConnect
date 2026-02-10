import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type EventRecord = {
  title: string;
  description?: string | null;
  date: Timestamp;
  location?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type Event = {
  id: string;
  title: string;
  description?: string | null;
  date: Date;
  location?: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export function listenToEvents(
  churchId: string,
  callback: (events: Event[]) => void
) {
  if (!churchId) return () => {};

  const q = query(
    collection(db, "churches", churchId, "events"),
    orderBy("date", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const events: Event[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as EventRecord;

        return {
          id: docSnap.id,
          title: data.title,
          description: data.description ?? null,
          date: data.date.toDate(),
          location: data.location ?? null,
          createdAt: data.createdAt ? data.createdAt.toDate() : null,
          updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
        };
      });

      callback(events);
    },
    (error) => {
      if (error.code !== "permission-denied") {
        console.error("listenToEvents error:", error);
      }
    }
  );
}


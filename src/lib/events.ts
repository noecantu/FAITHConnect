import {
    collection,
    query,
    orderBy,
    onSnapshot,
    Timestamp,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
  } from "firebase/firestore";
  import { db } from "./firebase";
  
  export type EventRecord = {
    title: string;
    description?: string;
    start: Timestamp;
    end: Timestamp;
    location?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  };
  
  export type Event = {
    id: string;
    title: string;
    description?: string;
    start: Date;
    end: Date;
    location?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  
  export function listenToEvents(
    churchId: string,
    callback: (events: Event[]) => void
  ) {
    const q = query(
      collection(db, "churches", churchId, "events"),
      orderBy("start", "asc")
    );
  
    return onSnapshot(q, (snapshot) => {
      const events: Event[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as EventRecord;
  
        return {
          id: docSnap.id,
          title: data.title,
          description: data.description,
          start: data.start.toDate(),
          end: data.end.toDate(),
          location: data.location,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        };
      });
  
      callback(events);
    });
  }
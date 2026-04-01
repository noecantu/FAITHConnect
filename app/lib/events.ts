// app/lib/events.ts
import { db } from "@/app/lib/firebase/client";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Create a new event under /churches/{churchId}/events
 */
export async function createEvent(churchId: string, data: any) {
  if (!churchId) throw new Error("Missing churchId");

  const ref = collection(db, "churches", churchId, "events");

  return await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update an existing event
 */
export async function updateEvent(
  churchId: string,
  eventId: string,
  data: any
) {
  if (!churchId) throw new Error("Missing churchId");
  if (!eventId) throw new Error("Missing eventId");

  const ref = doc(db, "churches", churchId, "events", eventId);

  return await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

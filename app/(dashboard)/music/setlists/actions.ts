"use server";

import { db } from "@/app/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";

import type {
  SetList,
  SetListFirestore,
  SetListSection,
} from "@/app/lib/types";

import { fromDateString, toDateTime } from "@/app/lib/date-utils";
import { nanoid } from "nanoid";

// Collection reference
function setlistsCollection(churchId: string) {
  return collection(db, "churches", churchId, "setlists");
}

function setlistDoc(churchId: string, id: string) {
  return doc(db, "churches", churchId, "setlists", id);
}

// Normalize Firestore → SetList
function normalizeSetList(id: string, data: SetListFirestore, churchId: string): SetList {
  const sections: SetListSection[] =
    (data.sections ?? []).map((s) => ({
      ...s,
      title: s.title || "Untitled Section",
    })) || [];

  return {
    id,
    churchId,
    title: data.title,

    dateString: data.dateString,
    timeString: data.timeString,

    date: fromDateString(data.dateString),
    dateTime: toDateTime(data.dateString, data.timeString),

    sections,
    createdBy: data.createdBy,

    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toMillis()
        : Date.now(),

    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toMillis()
        : Date.now(),

    serviceType: data.serviceType ?? null,
    serviceNotes: data.serviceNotes ?? null,
  };
}

// Get all setlists
export async function getSetlists(churchId: string): Promise<SetList[]> {
  const q = query(setlistsCollection(churchId), orderBy("dateString", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((docSnap) =>
    normalizeSetList(docSnap.id, docSnap.data() as SetListFirestore, churchId)
  );
}

// Get one setlist
export async function getSetlistById(
  churchId: string,
  id: string
): Promise<SetList | null> {
  const snap = await getDoc(setlistDoc(churchId, id));
  if (!snap.exists()) return null;

  return normalizeSetList(
    snap.id,
    snap.data() as SetListFirestore,
    churchId
  );
}

// Create
export async function createSetlist(
  churchId: string,
  data: {
    title: string;
    dateString: string;
    timeString: string;
    sections: SetListSection[];
    createdBy: string;
    serviceType: "Sunday" | "Midweek" | "Special" | null;
    serviceNotes?: {
      theme?: string | null;
      scripture?: string | null;
      notes?: string | null;
    } | null;
  }
) {
  const ref = await addDoc(setlistsCollection(churchId), {
    ...data,
    churchId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const snap = await getDoc(ref);
  return normalizeSetList(
    ref.id,
    snap.data() as SetListFirestore,
    churchId
  );
}

export async function updateSetlist(
  churchId: string,
  id: string,
  data: Partial<{
    title: string;
    dateString: string;
    timeString: string;
    sections: SetListSection[];
    serviceType: "Sunday" | "Midweek" | "Special" | null;
    serviceNotes: {
      theme?: string | null;
      scripture?: string | null;
      notes?: string | null;
    } | null;
  }>
) {
  const payload: any = {};

  if (data.title !== undefined) payload.title = data.title;
  if (data.dateString !== undefined) payload.dateString = data.dateString;
  if (data.timeString !== undefined) payload.timeString = data.timeString;
  if (data.sections !== undefined) payload.sections = data.sections;
  if (data.serviceType !== undefined) payload.serviceType = data.serviceType;

  if (data.serviceNotes !== undefined) {
    payload.serviceNotes = {
      theme: data.serviceNotes?.theme ?? null,
      scripture: data.serviceNotes?.scripture ?? null,
      notes: data.serviceNotes?.notes ?? null,
    };
  }

  payload.updatedAt = serverTimestamp();

  await updateDoc(setlistDoc(churchId, id), payload);
}

// Delete
export async function deleteSetlist(churchId: string, id: string) {
  await deleteDoc(setlistDoc(churchId, id));
}

// Duplicate
export async function duplicateSetlist(
  churchId: string,
  id: string,
  createdBy: string
) {
  const original = await getSetlistById(churchId, id);
  if (!original) return null;

  const newData = {
    title: `${original.title} (Copy)`,
    dateString: original.dateString,
    timeString: original.timeString,
    sections: original.sections.map((s) => ({
      ...s,
      id: nanoid(),
      songs: s.songs.map((song) => ({ ...song, id: nanoid() })),
    })),
    createdBy,
    serviceType: original.serviceType,
    serviceNotes: original.serviceNotes,
  };

  return createSetlist(churchId, newData);
}

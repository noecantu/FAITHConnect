// lib/setlists.ts

import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  CollectionReference,
  Timestamp,
} from 'firebase/firestore';

import { db } from './firebase';
import type { SetList, SetListFirestore, SetListSection } from './types';
import { nanoid } from 'nanoid';
import { fromDateString, toDateString, toDateTime } from './date-utils';

export function setListDoc(churchId: string, setListId: string) {
  return doc(db, `churches/${churchId}/setlists/${setListId}`);
}

// -----------------------------------------------------
// Collection reference
// -----------------------------------------------------
export function setListsCollection(churchId: string) {
  return collection(
    db,
    'churches',
    churchId,
    'setlists'
  ) as CollectionReference<SetListFirestore>;
}

// -----------------------------------------------------
// Real-time listener
// -----------------------------------------------------
export function listenToSetLists(
  churchId: string,
  callback: (lists: SetList[]) => void,
  userId?: string
) {
  if (!churchId || !userId) return () => {};

  // IMPORTANT: sort by dateString, not Timestamp
  const q = query(setListsCollection(churchId), orderBy('dateString', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const lists: SetList[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        return {
          id: docSnap.id,
          churchId: data.churchId,
          title: data.title,

          dateString: data.dateString,
          timeString: data.timeString,

          date: fromDateString(data.dateString),
          dateTime: toDateTime(data.dateString, data.timeString),

          sections: data.sections ?? [],
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
          updatedAt: data.updatedAt?.toMillis?.() ?? Date.now(),

          serviceType: data.serviceType,
          serviceNotes: data.serviceNotes,
        };
      });

      callback(lists);
    },
    (error) => {
      if (error.code !== "permission-denied") {
        console.error("listenToSetLists error:", error);
      }
    }
  );
}

// -----------------------------------------------------
// Create Set List
// -----------------------------------------------------
export async function createSetList(
  churchId: string | null,
  data: {
    title: string;
    date: Date;
    time: string;
    sections: SetListSection[];
    createdBy: string;
    serviceType: 'Sunday' | 'Midweek' | 'Special' | null;
    serviceNotes?: {
      theme?: string | null;
      scripture?: string | null;
      notes?: string | null;
    } | null;
  }
) {
  if (!churchId) throw new Error("churchId is required");

  const cid = churchId;

  const ref = await addDoc(setListsCollection(cid), {
    title: data.title,
    dateString: toDateString(data.date),
    timeString: data.time,
    sections: data.sections,
    createdBy: data.createdBy,
    serviceType: data.serviceType,
    ...(data.serviceNotes !== undefined && { serviceNotes: data.serviceNotes }),
    churchId: cid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const snap = await getDoc(ref);
  const docData = snap.data() as SetListFirestore;

  return {
    id: ref.id,
    churchId: cid,
    title: docData.title,

    dateString: docData.dateString,
    timeString: docData.timeString,

    date: fromDateString(docData.dateString),
    dateTime: toDateTime(docData.dateString, docData.timeString),

    sections: docData.sections ?? [],
    createdBy: docData.createdBy,

    createdAt:
      docData.createdAt instanceof Timestamp
        ? docData.createdAt.toMillis()
        : Date.now(),

    updatedAt:
      docData.updatedAt instanceof Timestamp
        ? docData.updatedAt.toMillis()
        : Date.now(),

    serviceType: docData.serviceType,
    serviceNotes: docData.serviceNotes ?? null,
  } as SetList;
}

// -----------------------------------------------------
// Update Set List
// -----------------------------------------------------
export async function updateSetList(
  churchId: string,
  setListId: string,
  data: {
    title?: string;
    date?: Date;
    time?: string;
    sections?: SetListSection[];
    serviceType?: 'Sunday' | 'Midweek' | 'Special' | null;
    serviceNotes?: {
      theme?: string | null;
      scripture?: string | null;
      notes?: string | null;
    } | null;
  }
) {
  if (!churchId) throw new Error("churchId is required");

  const cid = churchId;

  // Build payload in a type-safe way
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (data.title !== undefined) {
    payload.title = data.title;
  }

  if (data.date !== undefined) {
    payload.dateString = toDateString(data.date); // safe, local-time formatter
  }

  if (data.time !== undefined) {
    payload.timeString = data.time;
  }

  if (data.sections !== undefined) {
    payload.sections = data.sections;
  }

  if (data.serviceType !== undefined) {
    payload.serviceType = data.serviceType;
  }

  if (data.serviceNotes !== undefined) {
    payload.serviceNotes = data.serviceNotes;
  }

  await updateDoc(setListDoc(cid, setListId), payload);
}

// -----------------------------------------------------
// Delete Set List
// -----------------------------------------------------
export async function deleteSetList(
  churchId: string | null,
  setListId: string,
  router: { push: (path: string) => void }
) {
  if (!churchId) return;

  await deleteDoc(doc(db, "churches", churchId, "setlists", setListId));
  router.push("/music/setlists");
}

// -----------------------------------------------------
// Get Set List by ID
// -----------------------------------------------------
export async function getSetListById(
  churchId: string,
  id: string
): Promise<SetList | null> {
  const ref = doc(db, 'churches', churchId, 'setlists', id);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data();

  let sections: SetListSection[] = (data.sections || []).map((s: unknown) => {
    const section = s as Partial<SetListSection> & { name?: string };

    return {
      ...section,
      title: section.title || section.name || "Untitled Section",
    } as SetListSection;
  });

  if ((!sections || sections.length === 0) && data.songs) {
    sections = [
      {
        id: nanoid(),
        title: "Main",
        songs: data.songs,
      },
    ];
  }

  return {
    id: snap.id,
    churchId,
    title: data.title,

    dateString: data.dateString,
    timeString: data.timeString,

    date: fromDateString(data.dateString),
    dateTime: toDateTime(data.dateString, data.timeString),

    sections,
    createdBy: data.createdBy,
    createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
    updatedAt: data.updatedAt?.toMillis?.() ?? Date.now(),

    serviceType: data.serviceType,
    serviceNotes: data.serviceNotes,
  };
}

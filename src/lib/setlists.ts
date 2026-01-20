// lib/setlists.ts

import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    onSnapshot,
  } from 'firebase/firestore';
  
  import { db } from './firebase';
  import type { SetList, SetListSongEntry } from './types';
  
  // -----------------------------------------------------
  // Collection reference
  // -----------------------------------------------------
  export function setListsCollection(churchId: string) {
    return collection(db, 'churches', churchId, 'setlists');
  }
  
  // -----------------------------------------------------
  // Real-time listener
  // -----------------------------------------------------
  export function listenToSetLists(
    churchId: string,
    callback: (lists: SetList[]) => void
  ) {
    const q = query(setListsCollection(churchId), orderBy('date', 'desc'));
  
    return onSnapshot(q, (snapshot) => {
      const lists: SetList[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...(data as any),
          date: data.date?.toDate?.() ?? new Date(),
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        } as SetList;
      });
  
      callback(lists);
    });
  }
  
  // -----------------------------------------------------
  // Create Set List
  // -----------------------------------------------------
  export async function createSetList(
    churchId: string,
    data: Omit<SetList, 'id' | 'churchId' | 'createdAt' | 'updatedAt'>
  ) {
    const ref = await addDoc(setListsCollection(churchId), {
      ...data,
      churchId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  
    const snap = await getDoc(ref);
    const docData = snap.data();
  
    return {
      id: ref.id,
      ...(docData as any),
      date: docData?.date?.toDate?.() ?? new Date(),
      createdAt: docData?.createdAt?.toDate?.() ?? new Date(),
      updatedAt: docData?.updatedAt?.toDate?.() ?? new Date(),
    } as SetList;
  }
  
  // -----------------------------------------------------
  // Update Set List
  // -----------------------------------------------------
  export async function updateSetList(
    churchId: string,
    setListId: string,
    data: Partial<Omit<SetList, 'id' | 'churchId' | 'createdAt' | 'updatedAt'>>
  ) {
    const ref = doc(db, 'churches', churchId, 'setlists', setListId);
  
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }
  
  // -----------------------------------------------------
  // Delete Set List
  // -----------------------------------------------------
  export async function deleteSetList(churchId: string, setListId: string) {
    const ref = doc(db, 'churches', churchId, 'setlists', setListId);
    await deleteDoc(ref);
  }
  
  export async function getSetListById(churchId: string, id: string): Promise<SetList | null> {
    const ref = doc(db, 'churches', churchId, 'setlists', id);
    const snap = await getDoc(ref);
  
    if (!snap.exists()) return null;
  
    const data = snap.data();
  
    return {
      id: snap.id,
      churchId,
      title: data.title,
      date: data.date.toDate(),
      songs: data.songs ?? [],
      createdBy: data.createdBy,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      serviceType: data.serviceType,
      serviceNotes: data.serviceNotes,
    };
  }
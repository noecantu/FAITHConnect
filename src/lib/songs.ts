// lib/songs.ts

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
  import type { Song } from './types';
  
  // -----------------------------------------------------
  // Collection reference
  // -----------------------------------------------------
  export function songsCollection(churchId: string) {
    return collection(db, 'churches', churchId, 'songs');
  }
  
  // -----------------------------------------------------
  // Real-time listener
  // -----------------------------------------------------
  export function listenToSongs(
    churchId: string | null,
    callback: (songs: Song[]) => void
  ) {
    if (!churchId) {
      // Return a no-op unsubscribe function
      return () => {};
    }
  
    const q = query(songsCollection(churchId), orderBy('title'));
  
    return onSnapshot(q, (snapshot) => {
      const songs: Song[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...(data as any),
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        };
      });
  
      callback(songs);
    });
  }
  
  // -----------------------------------------------------
  // Create Song
  // -----------------------------------------------------
  export async function createSong(
    churchId: string,
    data: Omit<Song, 'id' | 'churchId' | 'createdAt' | 'updatedAt'>
  ) {
    // Remove undefined fields so Firestore doesn't choke
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
  
    const ref = await addDoc(songsCollection(churchId), {
      ...cleaned,
      churchId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  
    const snap = await getDoc(ref);
    const docData = snap.data();
  
    return {
      id: ref.id,
      ...(docData as any),
      createdAt: docData?.createdAt?.toDate?.() ?? new Date(),
      updatedAt: docData?.updatedAt?.toDate?.() ?? new Date(),
    } as Song;
  }  
  
  // -----------------------------------------------------
  // Get all songs (non-realtime)
  // -----------------------------------------------------
  export async function getSongs(churchId: string): Promise<Song[]> {
    const q = query(songsCollection(churchId), orderBy('title'));
    const snap = await getDocs(q);
  
    return snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...(data as any),
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
      } as Song;
    });
  }
  
  // -----------------------------------------------------
  // Update Song
  // -----------------------------------------------------
  export async function updateSong(
    churchId: string,
    songId: string,
    data: Partial<Omit<Song, 'id' | 'churchId' | 'createdAt' | 'updatedAt'>>
  ) {
    const ref = doc(db, 'churches', churchId, 'songs', songId);
  
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }
  
  // -----------------------------------------------------
  // Delete Song
  // -----------------------------------------------------
  export async function deleteSong(churchId: string, songId: string) {
    const ref = doc(db, 'churches', churchId, 'songs', songId);
    await deleteDoc(ref);
  }
  
  export async function getSongById(churchId: string, songId: string): Promise<Song | null> {
    const ref = doc(db, `churches/${churchId}/songs/${songId}`);
    const snap = await getDoc(ref);
  
    if (!snap.exists()) return null;
  
    const data = snap.data();
  
    return {
      id: snap.id,
      ...(data as any),
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    } as Song;
  }
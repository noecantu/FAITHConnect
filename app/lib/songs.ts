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
    Timestamp,
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
    callback: (songs: Song[]) => void,
    userId?: string
  ) {
    // Prevent listener from attaching during logout or unstable auth
    if (!churchId || !userId) return () => {};

    const q = query(songsCollection(churchId), orderBy("title"));

    return onSnapshot(
      q,
      (snapshot) => {
        const songs: Song[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;

          return {
            id: docSnap.id,
            ...data,
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date(),
            updatedAt:
              data.updatedAt instanceof Timestamp
                ? data.updatedAt.toDate()
                : new Date(),
          } as Song;
        });

        callback(songs);
      },
      (error) => {
        // Swallow the expected logout error
        if (error.code !== "permission-denied") {
          console.error("listenToSongs error:", error);
        }
      }
    );
  }
  
  // -----------------------------------------------------
  // Create Song
  // -----------------------------------------------------
  export async function createSong(
    churchId: string,
    data: Omit<Song, "id" | "churchId" | "createdAt" | "updatedAt">
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

    // Narrow docData safely
    const base = (docData ?? {}) as Record<string, unknown>;

    return {
      id: ref.id,
      ...base,
      createdAt:
        base.createdAt instanceof Timestamp
          ? base.createdAt.toDate()
          : new Date(),
      updatedAt:
        base.updatedAt instanceof Timestamp
          ? base.updatedAt.toDate()
          : new Date(),
    } as Song;
  }
  
  // -----------------------------------------------------
  // Get all songs (non-realtime)
  // -----------------------------------------------------
  export async function getSongs(churchId: string): Promise<Song[]> {
    const q = query(songsCollection(churchId), orderBy("title"));
    const snap = await getDocs(q);

    return snap.docs.map((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;

      return {
        id: docSnap.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(),
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate()
            : new Date(),
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
    const ref = doc(db, "churches", churchId, "songs", songId);
    await deleteDoc(ref);
  }

  export async function getSongById(
    churchId: string,
    songId: string
  ): Promise<Song | null> {
    const ref = doc(db, `churches/${churchId}/songs/${songId}`);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    // Firestore returns DocumentData = Record<string, unknown>
    const data = snap.data() as Record<string, unknown>;

    return {
      id: snap.id,
      ...data,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(),
      updatedAt:
        data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : new Date(),
    } as Song;
  }
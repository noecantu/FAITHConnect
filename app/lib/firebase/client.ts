"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import type { Firestore } from "firebase/firestore";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
} from "firebase/firestore";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";

console.log("CLIENT ENV CHECK", {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

// --- 1. Firebase config ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// --- 2. Initialize app once ---
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// --- 3. Firestore (browser only) ---
let db: Firestore;

if (typeof window !== "undefined") {
  if (process.env.NODE_ENV === "development") {
    db = initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });
  } else {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  }
} else {
  // Placeholder for SSR — never used
  db = {} as Firestore;
}

// --- 4. Auth ---
const auth = getAuth(app);

// Ensure persistence is set only in the browser
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}

// --- 5. Storage ---
const storage = getStorage(app);

// --- 6. Exports ---
export { app, db, auth, storage };

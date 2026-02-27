import { initializeApp, getApp, getApps, FirebaseApp, deleteApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  getAuth,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

// --- App singleton ---
const firebaseConfig = {
  apiKey: "AIzaSyDpZne6F54SJwPjPJouEWo7umZyieNPHTA",
  authDomain: "faith-connect-7342d.firebaseapp.com",
  projectId: "faith-connect-7342d",
  storageBucket: "faith-connect-7342d.firebasestorage.app",
  messagingSenderId: "403046678098",
  appId: "1:403046678098:web:4e9e04e752de450505698b",
  measurementId: "G-QCRKHZKNVE",
};

const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// --- Firestore singleton ---
let dbInstance;

if (!dbInstance) {
  const useMemoryCache = process.env.NODE_ENV === "development";

  dbInstance = initializeFirestore(app, {
    localCache: useMemoryCache
      ? memoryLocalCache()
      : persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
  });
}

export const db = dbInstance;

// Storage + Auth
export const storage = getStorage(app);
export const auth = getAuth(app);

// Ensure persistence is set safely
setPersistence(auth, browserLocalPersistence).catch(() => {});

// Secondary user creation
export async function createSecondaryUser(email: string, password: string) {
  const secondaryAppName = "secondaryApp";

  let secondaryApp: FirebaseApp;

  const existingApp = getApps().find((a) => a.name === secondaryAppName);
  secondaryApp = existingApp ?? initializeApp(firebaseConfig, secondaryAppName);

  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      password
    );

    await secondaryAuth.signOut();
    return userCredential.user;
  } finally {
    try {
      await deleteApp(secondaryApp);
    } catch {}
  }
}

export { app };

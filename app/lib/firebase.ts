// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, deleteApp, FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDpZne6F54SJwPjPJouEWo7umZyieNPHTA",
  authDomain: "faith-connect-7342d.firebaseapp.com",
  projectId: "faith-connect-7342d",
  storageBucket: "faith-connect-7342d.firebasestorage.app",
  messagingSenderId: "403046678098",
  appId: "1:403046678098:web:4e9e04e752de450505698b",
  measurementId: "G-QCRKHZKNVE",
};

// Initialize Firebase
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

/**
 * Creates a new user in Firebase Authentication without logging out the current user.
 * This is done by initializing a secondary Firebase App instance.
 */
export async function createSecondaryUser(email: string, password: string) {
  const secondaryAppName = "secondaryApp";

  let secondaryApp: FirebaseApp;

  // Check if app already exists
  const existingApp = getApps().find((a) => a.name === secondaryAppName);
  if (existingApp) {
    secondaryApp = existingApp;
  } else {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  }

  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      password
    );

    // Sign out to avoid auth collisions
    await secondaryAuth.signOut();

    return userCredential.user;
  } finally {
    // Clean up the secondary app instance safely
    try {
      await deleteApp(secondaryApp);
    } catch {
      // Ignore — app may already be deleted during hot reload
    }
  }
}

export { app };

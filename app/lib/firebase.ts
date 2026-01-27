// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, deleteApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDpZne6F54SJwPjPJouEWo7umZyieNPHTA",
  authDomain: "faith-connect-7342d.firebaseapp.com",
  projectId: "faith-connect-7342d",
  storageBucket: "faith-connect-7342d.firebasestorage.app",
  messagingSenderId: "403046678098",
  appId: "1:403046678098:web:4e9e04e752de450505698b",
  measurementId: "G-QCRKHZKNVE"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

/**
 * Creates a new user in Firebase Authentication without logging out the current user.
 * This is done by initializing a secondary Firebase App instance.
 */
export async function createSecondaryUser(email: string, password: string) {
  const secondaryAppName = "secondaryApp";
  let secondaryApp;

  // check if app already exists
  const existingApp = getApps().find(app => app.name === secondaryAppName);
  if (existingApp) {
      secondaryApp = existingApp;
  } else {
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  }

  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    // Important: Sign out immediately so this secondary auth instance doesn't interfere
    // although simply deleting the app instance usually handles it.
    await secondaryAuth.signOut();
    return userCredential.user;
  } finally {
    // Clean up the secondary app instance
    await deleteApp(secondaryApp);
  }
}

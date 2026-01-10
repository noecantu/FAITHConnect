// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

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
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

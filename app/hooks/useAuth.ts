//app/hooks/useAuth.ts
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase/client";
import type { AppUser } from "@/app/lib/types";

let logoutTransitionInProgress = false;
const logoutTransitionListeners = new Set<() => void>();

function emitLogoutTransitionChange() {
  logoutTransitionListeners.forEach((listener) => listener());
}

export function startLogoutTransition() {
  logoutTransitionInProgress = true;
  emitLogoutTransitionChange();
}

export function clearLogoutTransition() {
  if (!logoutTransitionInProgress) return;

  logoutTransitionInProgress = false;
  emitLogoutTransitionChange();
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(logoutTransitionInProgress);

  useEffect(() => {
    const listener = () => setLogoutLoading(logoutTransitionInProgress);

    logoutTransitionListeners.add(listener);
    return () => {
      logoutTransitionListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        // If a manual logout is in progress, stay in the loading state until
        // the page navigates away — clearing it here would expose unauthenticated
        // fallback UI for a frame before window.location.href fires.
        if (!logoutTransitionInProgress) {
          setLoading(false);
        }
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        setUser(null);
        clearLogoutTransition();
        setLoading(false);
        return;
      }

      const firestoreData = snap.data();

      const res = await fetch("/api/users/me");
      const serverData = res.ok ? await res.json() : {};

      const mergedUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? "",
        ...firestoreData,
        ...serverData,
      };

      setUser(mergedUser);
      clearLogoutTransition();
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  return { user, loading: loading || logoutLoading };
}


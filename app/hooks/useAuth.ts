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

      try {
        let firestoreData: Record<string, unknown> = {};
        let firestoreExists = false;

        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(userRef);
          firestoreExists = snap.exists();
          if (firestoreExists) {
            firestoreData = snap.data() as Record<string, unknown>;
          }
        } catch (error: unknown) {
          const code =
            typeof error === "object" && error !== null && "code" in error
              ? String((error as { code?: unknown }).code)
              : "";

          if (code !== "permission-denied") {
            console.error("useAuth Firestore profile read failed:", error);
          }
        }

        let serverData: Record<string, unknown> = {};
        try {
          const res = await fetch("/api/users/me");
          if (res.ok) {
            serverData = (await res.json()) as Record<string, unknown>;
          }
        } catch (error) {
          console.error("useAuth server profile fetch failed:", error);
        }

        // Prefer server payload, then firestore payload, then auth payload.
        // This avoids hard-failing during initial login claim propagation.
        const mergedUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          ...firestoreData,
          ...serverData,
        };

        const hasProfileData =
          firestoreExists ||
          Boolean(serverData.uid) ||
          Boolean(serverData.email) ||
          Boolean(firestoreData.email);

        setUser(hasProfileData ? (mergedUser as AppUser) : null);
      } finally {
        clearLogoutTransition();
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return { user, loading: loading || logoutLoading };
}


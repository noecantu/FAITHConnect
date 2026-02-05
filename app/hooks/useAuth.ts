"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase";
import type { User } from "@/app/lib/types";

export function useAuth(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // User logged out
      if (!firebaseUser) {
        if (isActive) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);

      const unsubUserDoc = onSnapshot(
        userRef,
        (snap) => {
          if (!isActive) return;

          if (!snap.exists()) {
            setUser(null);
            setLoading(false);
            return;
          }

          const data = snap.data();

          const mergedUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email ?? "",
            roles: Array.isArray(data.roles) ? data.roles : [],
            churchId: data.churchId ?? null,
            firstName: data.firstName,
            lastName: data.lastName,
            settings: data.settings,
          };

          setUser(mergedUser);
          setLoading(false);
        },
        (error) => {
          // Swallow expected logout error
          if (error.code !== "permission-denied") {
            console.error("useAuth userDoc listener error:", error);
          }
        }
      );

      return () => unsubUserDoc();
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  return { user, loading };
}

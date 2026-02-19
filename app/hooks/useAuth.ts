"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth } from "@/app/lib/firebase-client";
import { db } from "@/app/lib/firebase";
import type { User } from "@/app/lib/types";

export function useAuth(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
console.log("🔥 Firebase Auth state changed:", firebaseUser);

      // Always reset loading when auth state changes
      if (isActive) {
        setLoading(true);
      }
      // Clean up previous Firestore listener
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      // Logged out
      if (!firebaseUser) {
        if (isActive) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // Logged in → now wait for Firestore user doc
      const userRef = doc(db, "users", firebaseUser.uid);

      unsubscribeUserDoc = onSnapshot(
        userRef,
        (snap) => {
          if (!isActive) return;

          if (!snap.exists()) {
            setUser(null);
            setLoading(false);
            return;
          }

          const data = snap.data() as Partial<User>;
console.log("Firestore user doc:", data);
          const mergedUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email ?? "",
            roles: Array.isArray(data.roles) ? data.roles : [],
            churchId: data.churchId ?? null,
            firstName: data.firstName ?? null,
            lastName: data.lastName ?? null,
            settings: {
              attendanceView: data.settings?.attendanceView ?? "cards",
              calendarView: data.settings?.calendarView ?? "calendar",
              cardView: data.settings?.cardView ?? "show",
              fiscalYear: data.settings?.fiscalYear ?? undefined,
            },
          };
console.log("Merged user:", mergedUser);
          setUser(mergedUser);
          setLoading(false);
        },
        (error) => {
          if (error.code !== "permission-denied") {
            console.error("useAuth userDoc listener error:", error);
          }
          if (isActive) setLoading(false);
        }
      );
    });

    return () => {
      isActive = false;
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  return { user, loading };
}

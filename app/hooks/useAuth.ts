"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase/client";
import type { AppUser } from "@/app/lib/types";
import type { Role } from "@/app/lib/auth/roles";

export function useAuth(): { user: AppUser | null; loading: boolean } {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!isActive) return;

      // Logged out
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Logged in → listen to Firestore user doc
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

          const data = snap.data() as Partial<AppUser>;

          const mergedUser: AppUser = {
            uid: firebaseUser.uid,
            email: data.email ?? firebaseUser.email ?? "",
            roles: (data.roles ?? []) as Role[],
            churchId: data.churchId ?? null,
            regionId: data.regionId ?? null,
            firstName: data.firstName ?? null,
            lastName: data.lastName ?? null,
            settings: {
              attendanceView: data.settings?.attendanceView ?? "cards",
              calendarView: data.settings?.calendarView ?? "calendar",
              cardView: data.settings?.cardView ?? "show",
              fiscalYear: data.settings?.fiscalYear ?? undefined,
            },
          };

          setUser(mergedUser);
          setLoading(false);
        },
        () => {
          if (isActive) setLoading(false);
        }
      );
    });

    return () => {
      isActive = false;
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []); // ← IMPORTANT: no pathname dependency

  return { user, loading };
}

"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase/client";
import { usePathname } from "next/navigation";
import type { User } from "@/app/lib/types";
import type { Role } from "@/app/lib/auth/permissions/roles";

export function useAuth(): { user: User | null; loading: boolean } {
  const pathname = usePathname();

  // Public routes where user is NOT required
  const isPublicRoute =
    pathname.startsWith("/signup") ||
    pathname.startsWith("/onboarding/billing");

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!isActive) return;

      // IMPORTANT: keep loading = true on public routes
      if (isPublicRoute) {
        setLoading(true);
      }

      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      // Logged out
      if (!firebaseUser) {
        setUser(null);

        // Only stop loading if NOT on a public route
        if (!isPublicRoute) {
          setLoading(false);
        }

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

          const data = snap.data() as Partial<User>;

          const mergedUser: User = {
            id: firebaseUser.uid,
            email: data.email ?? firebaseUser.email ?? "",
            roles: (data.roles ?? []) as Role[],
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
  }, [pathname, isPublicRoute]);

  return { user, loading };
}

//app/hooks/useAuth.ts
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase/client";
import type { AppUser } from "@/app/lib/types";

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        setUser(null);
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
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  return { user, loading };
}


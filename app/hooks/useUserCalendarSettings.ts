'use client';

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";

export function useUserCalendarSettings(uid: string | null) {
  const [view, setViewState] = useState<"calendar" | "list">("calendar");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const ref = doc(db, "users", uid, "settings", "calendar");

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setViewState(data.view || "calendar");
      } else {
        // No settings doc yet → default to calendar
        setViewState("calendar");
      }
      setLoading(false);
    });

    return () => unsub();
  }, [uid]);

  const setView = async (v: "calendar" | "list") => {
    if (!uid) return;

    const ref = doc(db, "users", uid, "settings", "calendar");

    await setDoc(
      ref,
      {
        view: v,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  return { view, setView, loading };
}

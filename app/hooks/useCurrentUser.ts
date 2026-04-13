// app/hooks/useCurrentUser.ts
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { useAuth } from "./useAuth";
import type { AppUser } from "@/app/lib/types";
import type { Role } from "@/app/lib/auth/roles";
import { can } from "@/app/lib/auth/permissions";

export function useCurrentUser() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    async function loadUser() {
      if (!authUser) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      const ref = doc(db, "users", authUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();

        const normalizedUser: AppUser = {
          ...data,
          uid: authUser.uid,
          roles: (data.roles ?? []) as Role[],
          churchId: data.churchId ?? null,
          email: data.email ?? authUser.email ?? "",
        };

        setCurrentUser(normalizedUser);
      } else {
        setCurrentUser(null);
      }

      setLoading(false);
    }

    loadUser();
  }, [authLoading, authUser?.uid]);

  // Permission helpers
  const roles = currentUser?.roles ?? [];

  const isAdmin =
    can(roles, "church.manage") || can(roles, "system.manage");

  const canManageEvents =
    can(roles, "events.manage") || isAdmin;

  const canViewEvents =
    can(roles, "events.read") || canManageEvents;

  return {
    user: currentUser,
    loading,
    isAdmin,
    canManageEvents,
    canViewEvents,
  };
}

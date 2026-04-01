// app/hooks/useCurrentUser.ts
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { useAuth } from "./useAuth";
import type { User } from "@/app/lib/types";
import type { Role } from "@/app/lib/auth/permissions/roles";
import { can } from "@/app/lib/auth/permissions";

export function useCurrentUser() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    async function loadUser() {
      if (!authUser) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      const ref = doc(db, "users", authUser.id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();

        const normalizedUser: User = {
          ...data,
          id: authUser.id,
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
  }, [authLoading, authUser?.id]);

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

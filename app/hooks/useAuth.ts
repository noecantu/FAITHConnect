//app/hooks/useAuth.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseClient } from "@/app/lib/supabase/client";
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

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data as AppUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      clearLogoutTransition();
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Check current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          setUser(null);
          if (!logoutTransitionInProgress) {
            setLoading(false);
          }
          return;
        }

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
          setLoading(true);
          await fetchProfile();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return { user, loading: loading || logoutLoading };
}

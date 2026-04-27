//app/hooks/useAuth.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import type { AppUser } from "@/app/lib/types";
import {
  fetchCurrentUserCached,
  invalidateCurrentUserCache,
} from "@/app/lib/currentUserCache";

let logoutTransitionInProgress = false;
const logoutTransitionListeners = new Set<() => void>();

function emitLogoutTransitionChange() {
  logoutTransitionListeners.forEach((listener) => listener());
}

export function startLogoutTransition() {
  logoutTransitionInProgress = true;
  invalidateCurrentUserCache();
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
      const data = await fetchCurrentUserCached();
      setUser(data);
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
          invalidateCurrentUserCache();
          setUser(null);
          if (!logoutTransitionInProgress) {
            setLoading(false);
          }
          return;
        }

        // TOKEN_REFRESHED: update the cache so next read is fresh, but don't
        // force a re-render if a fetch is already in flight or data is cached.
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
          if (event === "TOKEN_REFRESHED") {
            // Bust the cache so the next fetch picks up updated claims
            invalidateCurrentUserCache();
          }
          setLoading(true);
          await fetchProfile();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return { user, loading: loading || logoutLoading };
}

"use client";

import { useParams } from "next/navigation";
import { useAuth } from "./useAuth";
import { useEffect, useState } from "react";

export function useChurchId() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [storedChurchId, setStoredChurchId] = useState<string | null>(null);

  // Load selected church from sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("selectedChurchId");
      if (saved) setStoredChurchId(saved);
    }
  }, []);

  // 1. ANY route with /church/[slug] or /admin/church/[churchId]
  // Works for:
  // - /church/[slug]
  // - /admin/church/[slug]
  // - /admin/regional/church/[slug]
  const routeChurchId =
    (typeof params?.churchId === "string" && params.churchId) ||
    (typeof params?.slug === "string" && params.slug) ||
    null;

  if (routeChurchId) {
    return {
      churchId: routeChurchId,
      church_id: routeChurchId,
      loading: authLoading,
    };
  }

  // 2. Fallback for Regional Admin on pages like /calendar
  if (storedChurchId) {
    return {
      churchId: storedChurchId,
      church_id: storedChurchId,
      loading: authLoading,
    };
  }

  // 3. Church Admin default
  return {
    churchId: user?.churchId ?? null,
    church_id: user?.churchId ?? null,
    loading: authLoading,
  };
}

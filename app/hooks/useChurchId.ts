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

  // 1. ANY route with /church/[slug]
  // Works for:
  // - /church/[slug]
  // - /admin/church/[slug]
  // - /admin/regional/church/[slug]
  if (params?.slug) {
    return {
      churchId: params.slug as string,
      loading: authLoading,
    };
  }

  // 2. Fallback for Regional Admin on pages like /calendar
  if (storedChurchId) {
    return {
      churchId: storedChurchId,
      loading: authLoading,
    };
  }

  // 3. Church Admin default
  return {
    churchId: user?.churchId ?? null,
    loading: authLoading,
  };
}

// Shared module-level cache and request deduplication for /api/users/me
// This ensures multiple hook instances and auth event firings share a single fetch.

import type { AppUser } from "@/app/lib/types";

const CACHE_TTL_MS = 30_000; // 30 seconds

interface ProfileCache {
  data: AppUser | null;
  timestamp: number;
}

let cache: ProfileCache | null = null;
let pendingFetch: Promise<AppUser | null> | null = null;

export async function fetchCurrentUserCached(): Promise<AppUser | null> {
  // Return a still-fresh cached result immediately
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache.data;
  }

  // Deduplicate concurrent in-flight requests
  if (pendingFetch) {
    return pendingFetch;
  }

  pendingFetch = fetch("/api/users/me", { credentials: "include" })
    .then((res) => (res.ok ? (res.json() as Promise<AppUser>) : null))
    .catch(() => null)
    .then((data) => {
      cache = { data, timestamp: Date.now() };
      pendingFetch = null;
      return data;
    });

  return pendingFetch;
}

export function invalidateCurrentUserCache(): void {
  cache = null;
  pendingFetch = null;
}

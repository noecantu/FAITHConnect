"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function createDeferredClientProxy(): SupabaseClient {
  return new Proxy({} as SupabaseClient, {
    get(_, prop: string | symbol) {
      if (prop === "then") return undefined;
      throw new Error(
        "Supabase browser client called during SSR/prerender — move getSupabaseClient() " +
          "inside useEffect or an event handler."
      );
    },
  });
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Returns a singleton Supabase browser client for use in client components.
 * Uses the public anon key — RLS policies govern data access.
 *
 * Guards against SSR/build-time prerender: NEXT_PUBLIC_* vars are injected
 * into the client bundle but may be absent during `next build` static page
 * generation. The proxy fallback means prerender completes without crashing;
 * actual data calls only happen in the browser where the real client is used.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    if (typeof window === "undefined") {
      return createDeferredClientProxy();
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key || !isValidHttpUrl(url)) {
      // During SSR/prerender or when env vars are misconfigured, return a proxy
      // so static generation can complete without constructing a real client.
      return createDeferredClientProxy();
    }

    client = createBrowserClient(url, key);
  }
  return client;
}

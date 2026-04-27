"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      // During SSR/prerender env vars are not embedded. Return a proxy that
      // won't crash at render time. useEffect/event handlers only run in the
      // browser where env vars are available and the real client is created.
      return new Proxy({} as SupabaseClient, {
        get(_, prop: string | symbol) {
          if (prop === "then") return undefined; // not a Promise/thenable
          throw new Error(
            "Supabase browser client called during SSR — move getSupabaseClient() " +
              "inside useEffect or an event handler."
          );
        },
      });
    }

    client = createBrowserClient(url, key);
  }
  return client;
}

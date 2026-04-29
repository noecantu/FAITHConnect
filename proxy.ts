//proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/app/lib/supabase/env";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const { url, anonKey } = getSupabasePublicEnv();

  // Refresh the Supabase session on every request so it stays alive.
  let proxyResponse = NextResponse.next({ request: req });

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          proxyResponse = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            proxyResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Ignore prefetch and internal Next.js router requests
  if (
    req.headers.get("purpose") === "prefetch" ||
    req.headers.get("x-middleware-prefetch") === "1" ||
    req.headers.get("next-router-prefetch") === "1"
  ) {
    return NextResponse.next();
  }

  // Ignore Next.js internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/__nextjs")) {
    return NextResponse.next();
  }

  // ---------------------------------------
  // PUBLIC ROUTES
  // ---------------------------------------
  // These routes don't need a session refresh — skip the Supabase getUser()
  // round-trip entirely. API routes manage their own auth server-side.
  const publicPatterns = [
    /^\/$/,                     // homepage
    /^\/marketing(\/.*)?$/,     // marketing pages
    /^\/login(\/.*)?$/,         // login
    /^\/api(\/.*)?$/,           // API routes
    /^\/onboarding(\/.*)?$/,    // onboarding flow
    /^\/stripe(\/.*)?$/,        // stripe callbacks
  ];

  if (publicPatterns.some((pattern) => pattern.test(pathname))) {
    return proxyResponse;
  }

  // Only refresh the Supabase session for authenticated dashboard routes.
  await supabase.auth.getUser();

  return proxyResponse;
}


export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
  ],
};



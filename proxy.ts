//proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
  const publicPatterns = [
    /^\/$/,                     // homepage
    /^\/marketing(\/.*)?$/,     // marketing pages
    /^\/login(\/.*)?$/,         // login
    /^\/api(\/.*)?$/,           // API routes
    /^\/onboarding(\/.*)?$/,    // onboarding flow
    /^\/stripe(\/.*)?$/,        // stripe callbacks
  ];

  if (publicPatterns.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next();
  }

  // ---------------------------------------
  // PROTECTED ROUTES
  // ---------------------------------------
  const sessionCookie = req.cookies.get("session")?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
  ],
};


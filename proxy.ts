import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySignupToken } from "@/app/lib/auth/verifySignupToken";

export async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

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
  // ALLOW SIGNUP
  // ---------------------------------------
  if (pathname === "/signup") {
    const hasStripeSession = searchParams.has("session_id");
    const hasToken = searchParams.has("token");

    // Coming from Stripe → allow
    if (hasStripeSession) {
      return NextResponse.next();
    }

    // Using token-based signup → validate token
    if (hasToken) {
      const tokenStatus = await verifySignupToken(searchParams.get("token")!);
      if (!tokenStatus.valid) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      return NextResponse.next();
    }

    // No session_id and no token → block
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ---------------------------------------
  // PUBLIC ROUTES
  // ---------------------------------------
  const publicPatterns = [
    /^\/$/,                 // homepage
    /^\/marketing/,         // marketing pages
    /^\/login/,             // login
    /^\/api/,               // API routes
    /^\/onboarding(\/.*)?$/ // onboarding flow
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
    "/((?!_next|__nextjs|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};

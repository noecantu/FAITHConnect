import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySignupToken } from "@/app/lib/auth/verifySignupToken";

export async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  console.log("PROXY PATHNAME:", pathname);

  // Ignore prefetch and internal Next.js router requests
  if (
    req.headers.get("purpose") === "prefetch" ||
    req.headers.get("x-middleware-prefetch") === "1" ||
    req.headers.get("next-router-prefetch") === "1"
  ) {
    return NextResponse.next();
  }

  // Ignore Next.js internal dev server requests
  if (pathname.startsWith("/_next") || pathname.startsWith("/__nextjs")) {
    return NextResponse.next();
  }

  // Protect /signup
  if (pathname === "/signup") {
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const tokenStatus = await verifySignupToken(token);

    if (!tokenStatus.valid) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  }

  // Public routes
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

  // Auth-protected routes
  const sessionCookie = req.cookies.get("session")?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run proxy on all routes EXCEPT Next.js internals and static assets
    "/((?!_next|__nextjs|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname } = req.nextUrl;

  // Public routes
  const publicPatterns = [
    /^\/$/,        // homepage
    /^\/marketing/,
    /^\/login/,
    /^\/signup/,
    // /^\/landing/,  // optional if you use /landing
    /^\/api/,
  ];
  if (publicPatterns.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next();
  }

  // Only check if cookie exists — DO NOT verify it here
  const sessionCookie = req.cookies.get("session")?.value;

  if (!sessionCookie) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
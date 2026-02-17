import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/server";

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname } = req.nextUrl;

  // ALWAYS PRESERVE QUERY PARAMS
  url.search = req.nextUrl.search;

  // PUBLIC ROUTES
  const publicPatterns = [/^\/login/, /^\/signup/, /^\/api/];
  if (publicPatterns.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next();
  }

  // SESSION COOKIE
  const sessionCookie = req.cookies.get("session")?.value;
  if (!sessionCookie) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // VERIFY SESSION
  let decoded;
  try {
    decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const uid = decoded.uid;

  // FETCH USER PROFILE
  const userSnap = await adminDb.collection("users").doc(uid).get();
  const user = userSnap.data();

  if (!user) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const roles: string[] = user.roles || [];
  const churchId: string | null = user.churchId || null;

  const isRootAdmin = roles.includes("RootAdmin");
  const isChurchAdmin = roles.includes("Admin") || roles.includes("ChurchAdmin");
  const isBasicMember = roles.length === 0;
  const isMember =
    isBasicMember ||
    roles.includes("Member") ||
    roles.includes("MusicManager") ||
    roles.includes("MusicMember");

  //
  // ROOT ADMIN LOGIC
  //
  if (isRootAdmin) {
    if (pathname === "/") {
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  //
  // CHURCH ADMIN LOGIC
  //
  if (isChurchAdmin && churchId) {
    const adminRoot = `/admin/church/${churchId}`;

    if (pathname === "/") {
      url.pathname = adminRoot;
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/admin") && !pathname.startsWith(adminRoot)) {
      url.pathname = adminRoot;
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  //
  // CHURCH ADMIN WITHOUT CHURCH → ONBOARDING
  //
  if (isChurchAdmin && !churchId) {
    if (!pathname.startsWith("/onboarding")) {
      url.pathname = "/onboarding/create-church";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  //
  // MEMBER LOGIC
  //
  if (isMember) {
    if (pathname === "/") {
      url.pathname = "/members";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/admin")) {
      url.pathname = "/members";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  //
  // UNKNOWN ROLE → LOGIN
  //
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};

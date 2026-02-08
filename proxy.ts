import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/server";

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname } = req.nextUrl;
console.log("PATHNAME:", pathname);
  // PUBLIC ROUTES
  const publicPaths = ["/login", "/signup", "/api"];
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
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

  const isRootAdmin = roles.includes("root");
  const isChurchAdmin = roles.includes("Admin") || roles.includes("ChurchAdmin");
  const isBasicMember = roles.length === 0;
  const isMember =
    isBasicMember ||
    roles.includes("Member") ||
    roles.includes("MusicManager") ||
    roles.includes("MusicMember");

  // ROOT ADMIN
  if (isRootAdmin) {
    if (!pathname.startsWith("/admin")) {
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // CHURCH ADMIN WITHOUT CHURCH → ONBOARDING
  if (isChurchAdmin && !churchId) {
    if (!pathname.startsWith("/onboarding")) {
      url.pathname = "/onboarding/create-church";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // CHURCH ADMIN WITH CHURCH
  if (isChurchAdmin && churchId) {
    const adminPath = `/admin/church/${churchId}`;
    if (!pathname.startsWith(adminPath)) {
      url.pathname = adminPath;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // MEMBER
  if (isMember) {
    if (!pathname.startsWith("/members")) {
      url.pathname = "/members";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // UNKNOWN ROLE
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};

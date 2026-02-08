import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/server";

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname } = req.nextUrl;

  // Public routes
  const publicPaths = ["/login", "/signup", "/api"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Read Firebase session cookie
  const sessionCookie = req.cookies.get("session")?.value;

  if (!sessionCookie) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Verify session cookie
  let decoded;
  try {
    decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const uid = decoded.uid;

  // Fetch user profile
  const userSnap = await adminDb.collection("users").doc(uid).get();
  const user = userSnap.data();

  if (!user) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Firestore uses "roles" (array)
  const roles: string[] = user.roles || [];
  const churchId: string | null = user.churchId || null;

  const isRootAdmin = roles.includes("root");
  const isChurchAdmin = roles.includes("ChurchAdmin") || roles.includes("Admin");

  // Treat MusicManager, MusicMember, and no-role users as Members
  const isBasicMember = roles.length === 0;
  const isMember =
    isBasicMember ||
    roles.includes("Member") ||
    roles.includes("MusicManager") ||
    roles.includes("MusicMember");

  //
  // ROOT ADMIN → always allowed into /admin
  //
  if (isRootAdmin) {
    if (!pathname.startsWith("/admin")) {
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  //
  // CHURCH ADMIN with NO church → onboarding
  //
  if (isChurchAdmin && !churchId) {
    if (!pathname.startsWith("/onboarding")) {
      url.pathname = "/onboarding/create-church";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  //
  // CHURCH ADMIN with church → block onboarding
  //
  if (isChurchAdmin && churchId && pathname.startsWith("/onboarding")) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  //
  // MEMBER (including MusicManager, MusicMember, and no-role users)
  //
  if (isMember) {
    if (!pathname.startsWith("/members")) {
      url.pathname = "/members";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  //
  // If user has roles but none match known categories → send to login
  //
  if (!roles.length) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico).*)",
  ],
};

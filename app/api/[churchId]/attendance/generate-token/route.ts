import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/firebaseAdmin";
import { getUserRolesForChurch } from "@/app/lib/server/getUserRolesForChurch";

const TOKEN_EXPIRATION_HOURS = 24;

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ churchId: string }> }
) {
  try {
    const { churchId } = await context.params;

    // ------------------------------
    // AUTHENTICATE USER
    // ------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    const idToken = authHeader.replace("Bearer ", "");
    const decoded = await adminAuth.verifyIdToken(idToken);

    // ------------------------------
    // AUTHORIZE USER
    // ------------------------------
    const roles = await getUserRolesForChurch(decoded.uid, churchId);

    if (!roles.some(r => r === "Admin" || r === "AttendanceManager")) {
      return NextResponse.json(
        { error: "Not authorized to generate attendance tokens" },
        { status: 403 }
      );
    }

    // ------------------------------
    // GENERATE DATE-BOUND TOKEN
    // ------------------------------
    const today = new Date();
    const dateString = today.toISOString().split("T")[0]; // YYYY-MM-DD

    const payload = {
      churchId,
      date: dateString,
      issuedAt: Date.now(),
      expiresAt: Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000, // ✔ allowed
    };

    const signedToken = await adminAuth.createCustomToken(
      `attendance-${churchId}-${dateString}`,
      payload
    );

    // ------------------------------
    // RETURN TOKEN + URL
    // ------------------------------
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/check-in/${churchId}?d=${dateString}&t=${signedToken}`;

    return NextResponse.json({
      token: signedToken,
      date: dateString,
      url,
    });
  } catch (err: unknown) {
    console.error("QR token generation error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

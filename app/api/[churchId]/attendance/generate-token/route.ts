import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { adminAuth, adminDb } from "@/lib/firebase/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request, context: { params: Promise<{ churchId: string }> }) {
  try {
    // -----------------------------
    // 1. UNWRAP PARAMS (Next.js 15)
    // -----------------------------
    const { churchId } = await context.params;

    if (!churchId) {
      return NextResponse.json(
        { error: "Missing churchId in route params" },
        { status: 400 }
      );
    }

    // -----------------------------
    // 2. AUTH CHECK
    // -----------------------------
    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const idToken = authHeader.replace("Bearer ", "");

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
    } catch (err) {
      console.error("Token verification failed:", err);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // -----------------------------
    // 3. PARSE BODY
    // -----------------------------
    const { date } = await req.json();

    if (!date) {
      return NextResponse.json(
        { error: "Missing date" },
        { status: 400 }
      );
    }

    // -----------------------------
    // 4. GENERATE TOKEN
    // -----------------------------
    const token = nanoid(24);

    // -----------------------------
    // 5. STORE TOKEN
    // -----------------------------
    await adminDb
      .collection("attendanceTokens")
      .doc(token)
      .set({
        churchId,
        date,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: decoded.uid,
      });

    // -----------------------------
    // 6. BUILD URL
    // -----------------------------
    const url = `/check-in/${churchId}?t=${token}&d=${date}`;

    return NextResponse.json({ token, url });
  } catch (err) {
    console.error("QR generation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

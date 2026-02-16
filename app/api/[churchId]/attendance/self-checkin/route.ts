import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/firebaseAdmin";

interface SelfCheckInRequest {
  token: string;
  date: string;
  checkInCode: string;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ churchId: string }> }
) {
  try {
    const { churchId } = await context.params;

    const body = (await req.json()) as SelfCheckInRequest;
    const { token, date, checkInCode } = body;

    if (!token || !date || !checkInCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ------------------------------
    // VERIFY TOKEN SIGNATURE
    // ------------------------------
    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired QR token" },
        { status: 401 }
      );
    }

    // ------------------------------
    // VALIDATE TOKEN CONTENT
    // ------------------------------
    if (decoded.churchId !== churchId) {
      return NextResponse.json(
        { error: "Token does not match this church" },
        { status: 403 }
      );
    }

    if (decoded.date !== date) {
      return NextResponse.json(
        { error: "Token date mismatch" },
        { status: 403 }
      );
    }

    if (decoded.exp && Date.now() > decoded.exp) {
      return NextResponse.json(
        { error: "QR token has expired" },
        { status: 401 }
      );
    }

    // ------------------------------
    // FIND MEMBER BY CHECK-IN CODE
    // ------------------------------
    const membersRef = adminDb
      .collection("churches")
      .doc(churchId)
      .collection("members");

    const memberQuery = await membersRef
      .where("checkInCode", "==", checkInCode)
      .limit(1)
      .get();

    if (memberQuery.empty) {
      return NextResponse.json(
        { error: "Invalid check-in code" },
        { status: 404 }
      );
    }

    const memberDoc = memberQuery.docs[0];
    const memberId = memberDoc.id;

    // ------------------------------
    // WRITE ATTENDANCE ENTRY
    // ------------------------------
    const attendanceRef = adminDb
      .collection("churches")
      .doc(churchId)
      .collection("attendance")
      .doc(date)
      .collection("entries")
      .doc(memberId);

    await attendanceRef.set(
      {
        memberId,
        checkInCode,
        timestamp: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Self-check-in error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

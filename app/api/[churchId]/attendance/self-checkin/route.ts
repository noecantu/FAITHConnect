import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebaseAdmin";

type AttendanceData = {
  records: Record<string, boolean>;
  visitors: string[];
};

export async function POST(
  req: Request,
  context: { params: Promise<{ churchId: string }> }
) {
  try {
    const { churchId } = await context.params;

    const { code: rawCode, date } = await req.json();
    const code = rawCode?.toString().trim().toUpperCase();

    if (!code || !date) {
      return NextResponse.json(
        { error: "Missing code or date" },
        { status: 400 }
      );
    }

    // 🔒 Enforce same-day check-in
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const today = `${yyyy}-${mm}-${dd}`;

    if (date !== today) {
      return NextResponse.json(
        { error: "This check-in link has expired. Please scan today's QR code." },
        { status: 400 }
      );
    }

    // 1. Find member by checkInCode
    const membersSnap = await adminDb
      .collection("churches")
      .doc(churchId)
      .collection("members")
      .where("checkInCode", "==", code)
      .get();

    if (membersSnap.empty) {
      return NextResponse.json(
        { error: "Invalid check‑in code" },
        { status: 404 }
      );
    }

    const memberId = membersSnap.docs[0].id;

    // 2. Attendance document for the day
    const attendanceRef = adminDb
      .collection("churches")
      .doc(churchId)
      .collection("attendance")
      .doc(date);

    const attendanceSnap = await attendanceRef.get();

    // 3. Normalize attendance structure
    const data: AttendanceData = attendanceSnap.exists
      ? (attendanceSnap.data() as AttendanceData)
      : { records: {}, visitors: [] };

    // 4. Prevent duplicate check‑ins
    if (data.records[memberId] === true) {
      return NextResponse.json({ alreadyCheckedIn: true });
    }

    // 5. Mark member as present
    data.records[memberId] = true;

    // 6. Save
    await attendanceRef.set(data, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SELF‑CHECKIN API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


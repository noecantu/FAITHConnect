import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Successfully wrote {path}")

# File 1
file1_path = "/Users/noecantu/dev/FAITHConnect/app/api/[churchId]/attendance/self-checkin/route.ts"
file1_content = """export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/supabase/admin";

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

    const { phone: rawPhone, code: rawCode, date } = await req.json();

    const phone = rawPhone?.toString().replace(/\\D/g, "");
    const code = rawCode?.toString().trim().toUpperCase();

    if (!phone || phone.length !== 10) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    if (!code || !date) {
      return NextResponse.json({ error: "Missing check-in code or date" }, { status: 400 });
    }

    // Enforce same-day check-in
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    if (date !== today) {
      return NextResponse.json(
        { error: "This check-in link has expired. Please scan today's QR code." },
        { status: 400 }
      );
    }

    // 1. Find member by phone + check-in code
    const { data: members } = await adminDb
      .from("members")
      .select("id")
      .eq("church_id", churchId)
      .eq("phone_number", phone)
      .eq("check_in_code", code)
      .limit(1);

    if (!members || members.length === 0) {
      return NextResponse.json({ error: "No matching member found." }, { status: 404 });
    }

    const memberId = members[0].id;

    // 2. Get or create attendance record for the day
    const { data: attendanceRow } = await adminDb
      .from("attendance")
      .select("records, visitors")
      .eq("church_id", churchId)
      .eq("date_string", date)
      .single();

    const data: AttendanceData = attendanceRow
      ? { records: attendanceRow.records ?? {}, visitors: attendanceRow.visitors ?? [] }
      : { records: {}, visitors: [] };

    // 3. Prevent duplicate check-ins
    if (data.records[memberId] === true) {
      return NextResponse.json({ alreadyCheckedIn: true });
    }

    // 4. Mark present
    data.records[memberId] = true;

    // 5. Upsert
    const { error } = await adminDb
      .from("attendance")
      .upsert(
        { church_id: churchId, date_string: date, records: data.records, visitors: data.visitors },
        { onConflict: "church_id,date_string" }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("SELF-CHECKIN API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}"""

write_file(file1_path, file1_content)

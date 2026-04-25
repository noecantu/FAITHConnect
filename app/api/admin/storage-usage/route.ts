export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/supabase/admin";

export async function GET() {
  try {
    // Estimate storage by summing JSON size of all rows in key tables
    let totalBytes = 0;

    const tables = ["users", "churches", "members", "events", "service_plans", "contributions", "songs", "setlists", "attendance", "logs", "districts", "regions"];

    for (const table of tables) {
      const { data } = await adminDb.from(table).select("*");
      if (data) {
        const json = JSON.stringify(data);
        totalBytes += Buffer.byteLength(json, "utf8");
      }
    }

    return NextResponse.json({ storageUsed: totalBytes });
  } catch (err) {
    console.error("Storage usage error:", err);
    return NextResponse.json({ storageUsed: null }, { status: 500 });
  }
}

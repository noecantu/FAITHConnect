export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminClient } from "@/app/lib/supabase/admin";
import { getServerUser } from "@/app/lib/supabase/server";

const BUCKET = "logos";

export async function POST(req: Request) {
  try {
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { filePath } = (await req.json()) as { filePath?: unknown };

    if (typeof filePath !== "string" || filePath.trim().length === 0) {
      return NextResponse.json({ error: "Missing filePath." }, { status: 400 });
    }

    const { error: deleteError } = await getAdminClient().storage
      .from(BUCKET)
      .remove([filePath]);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("logos/delete error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete logo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

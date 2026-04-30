export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { getAvailableScriptureTranslations } from "@/app/lib/scripture/translations";

export async function GET() {
  try {
    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const translations = await getAvailableScriptureTranslations();

    return NextResponse.json({ translations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load translations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

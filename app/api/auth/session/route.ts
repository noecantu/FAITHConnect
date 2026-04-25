export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";

/**
 * DELETE /api/auth/session — signs the user out on the server.
 * Called by the logout flow. Supabase SSR handles session creation
 * automatically via supabase.auth.signInWithPassword() on the client.
 */
export async function DELETE() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error signing out:", error);
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }
}

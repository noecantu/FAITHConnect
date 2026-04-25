export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";

// Service role client for creating users server-side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, firstName, lastName, password } = body;

    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Missing required fields: email, firstName, lastName" },
        { status: 400 }
      );
    }

    const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName },
    });

    if (error || !user) {
      throw error ?? new Error("Failed to create user");
    }

    return NextResponse.json({ success: true, uid: user.id });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}


export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { can } from "@/app/lib/auth/permissions";
import { createClient } from "@supabase/supabase-js";
import type { Role } from "@/app/lib/auth/roles";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: actor } = await adminDb
      .from("users")
      .select("roles, church_id")
      .eq("id", authUser.id)
      .single();

    if (!actor) {
      return NextResponse.json({ error: "Actor not found" }, { status: 403 });
    }

    const actorRoles = (actor.roles ?? []) as Role[];
    if (!can(actorRoles, "church.manage") && !can(actorRoles, "system.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { email, firstName, lastName, password, roles, churchId } = body;

    if (!email || !churchId) {
      return NextResponse.json({ error: "email and churchId are required" }, { status: 400 });
    }

    const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password || crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName },
    });

    if (createError || !user) {
      return NextResponse.json({ error: createError?.message ?? "Failed to create user" }, { status: 400 });
    }

    const uid = user.id;

    const { error: profileError } = await adminDb.from("users").insert({
      id: uid,
      email: email.trim().toLowerCase(),
      first_name: firstName?.trim() ?? "",
      last_name: lastName?.trim() ?? "",
      roles: Array.isArray(roles) && roles.length > 0 ? roles : ["Member"],
      church_id: churchId,
      onboarding_complete: true,
      onboarding_step: "complete",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(uid);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, uid });
  } catch (error) {
    console.error("church-users/create error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}


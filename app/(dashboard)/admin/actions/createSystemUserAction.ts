"use server";

import { adminDb } from "@/app/lib/supabase/admin";
import { logSystemEvent } from "@/app/lib/system/logging";
import { createClient } from "@supabase/supabase-js";

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabaseAdmin;
}

export interface CreateSystemUserInput {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  actorUid: string;
  actorName?: string | null;
}

export async function createSystemUserAction(input: CreateSystemUserInput) {
  const { first_name, last_name, email, password, actorUid, actorName } = input;

  const { data: authData, error: authError } = await getSupabaseAdmin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name, last_name },
  });

  if (authError) throw authError;
  const userId = authData.user.id;

  await adminDb.from("users").insert({
    id: userId,
    first_name,
    last_name,
    email,
    church_id: null,
    roles: [],
    region_id: null,
    region_name: null,
    created_at: new Date().toISOString(),
  });

  await logSystemEvent({
    type: "SYSTEM_USER_CREATED",
    actorUid,
    actorName,
    targetId: userId,
    targetType: "SYSTEM_USER",
    message: `Created system-level user: ${email}`,
    metadata: {},
  });

  return { success: true, userId };
}

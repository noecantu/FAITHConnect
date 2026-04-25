import "server-only";
import { createClient } from "@supabase/supabase-js";
import { adminDb } from "@/app/lib/supabase/admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ROOT_EMAIL = "root@faithconnect.app";
const ROOT_CHURCH_ID = "system";

export async function recoverRootAdmin() {
  // Try to find existing user
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) throw listError;

  let user = users.find((u) => u.email === ROOT_EMAIL);

  if (!user) {
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: ROOT_EMAIL,
      password: "TempRoot123!",
      email_confirm: true,
    });
    if (createError) throw createError;
    user = created.user;
  }

  if (!user) throw new Error("Failed to get or create root admin user");

  // Upsert user profile
  await adminDb.from("users").upsert({
    id: user.id,
    email: ROOT_EMAIL,
    roles: ["RootAdmin"],
    church_id: ROOT_CHURCH_ID,
    first_name: "Root",
    last_name: "Admin",
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }, { onConflict: "id" });

  // Generate a real password reset link
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: ROOT_EMAIL,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/reset-password`,
    },
  });
  const resetLink = linkError ? "(visit Supabase dashboard to reset password)" : linkData.properties.action_link;

  return {
    uid: user.id,
    email: ROOT_EMAIL,
    resetLink,
  };
}

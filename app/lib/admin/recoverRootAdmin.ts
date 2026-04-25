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

  // Generate a password reset link via Supabase admin API
  const resetLink = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?type=recovery&token=MANUAL_RESET_REQUIRED`;

  return {
    uid: user.id,
    email: ROOT_EMAIL,
    resetLink,
  };
}

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin environment variables");
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
}

const ROOT_EMAIL = "root@faithconnect.app";
const ROOT_CHURCH_ID = "system";

export async function recoverRootAdmin() {
  // Initialize lazily — only when the function is called
  const app = getAdminApp();

  const auth = getAuth(app);
  const db = getFirestore(app);

  let user;

  try {
    user = await auth.getUserByEmail(ROOT_EMAIL);
  } catch {
    user = await auth.createUser({
      email: ROOT_EMAIL,
      password: "TempRoot123!",
      emailVerified: true,
    });
  }

  await auth.setCustomUserClaims(user.uid, {
    roles: ["RootAdmin"],
    church_id: ROOT_CHURCH_ID,
  });

  await db.collection("users").doc(user.uid).set(
    {
      uid: user.uid,
      email: ROOT_EMAIL,
      roles: ["RootAdmin"],
      church_id: ROOT_CHURCH_ID,
      first_name: "Root",
      last_name: "Admin",
      updated_at: new Date(),
      created_at: new Date(),
    },
    { merge: true }
  );

  const resetLink = await auth.generatePasswordResetLink(ROOT_EMAIL);

  return {
    uid: user.uid,
    email: ROOT_EMAIL,
    resetLink,
  };
}

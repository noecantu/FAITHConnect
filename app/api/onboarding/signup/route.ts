export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb, getAdminClient } from "@/app/lib/supabase/admin";
import { isMissingTableError, schemaNotInitializedResponse } from "@/app/lib/supabase/schema-errors";

export async function POST(req: Request) {
  try {
    const { email, password, firstName, lastName, plan } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let uid: string;

    // Attempt to create the user via admin (no confirmation email)
    const { data: created, error: createError } = await getAdminClient().auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });

    if (createError) {
      const msg = createError.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("duplicate")) {
        return NextResponse.json(
          { error: "That email is already registered. Try logging in or reset your password.", alreadyExists: true },
          { status: 409 }
        );
      } else {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }
    } else {
      if (!created.user) {
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
      }
      uid = created.user.id;
    }

    // Upsert profile in public.users
    const { error: profileError } = await adminDb.from("users").upsert(
      {
        id: uid,
        email: normalizedEmail,
        first_name: firstName || "",
        last_name: lastName || "",
        church_id: null,
        roles: ["Admin"],
        plan_id: plan ?? null,
        onboarding_step: "billing",
        onboarding_complete: false,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      if (isMissingTableError(profileError)) {
        return NextResponse.json(schemaNotInitializedResponse("users"), { status: 503 });
      }
      console.error("Profile upsert error:", JSON.stringify(profileError));
      return NextResponse.json({ error: profileError.message ?? "Failed to save profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true, uid });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : JSON.stringify(err);
    console.error("Onboarding signup error:", message);
    if (isMissingTableError(err)) {
      return NextResponse.json(schemaNotInitializedResponse("users"), { status: 503 });
    }
    return NextResponse.json({ error: message || "Failed to create account" }, { status: 500 });
  }
}


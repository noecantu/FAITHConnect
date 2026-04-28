export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb, getAdminClient } from "@/app/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      uid,
      email,
      firstName,
      lastName,
      token,
      accessToken,
      roles,
      plan,
      onboardingStep,
      onboardingComplete,
    } = body;

    if (!uid || !email) {
      return NextResponse.json(
        { error: "Missing required fields: uid or email" },
        { status: 400 }
      );
    }

    const baseProfile: Record<string, unknown> = {
      id: uid,
      email,
      first_name: firstName || "",
      last_name: lastName || "",
      church_id: null,
      onboarding_step: onboardingStep ?? "billing",
      onboarding_complete: typeof onboardingComplete === "boolean" ? onboardingComplete : false,
      roles: Array.isArray(roles) && roles.length > 0 ? roles : ["Admin"],
      plan_id: plan ?? null,
    };

    if (!token) {
      // Signup flow — verify the caller is the same user being created.
      // Use the access_token from the signup response since cookies may not be set yet.
      let verifiedUid: string | null = null;
      if (accessToken) {
        const { data: { user: tokenUser } } = await getAdminClient().auth.getUser(accessToken);
        verifiedUid = tokenUser?.id ?? null;
      } else {
        const authUser = await getServerUser();
        verifiedUid = authUser?.id ?? null;
      }
      if (!verifiedUid || verifiedUid !== uid) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }

      const { error } = await adminDb
        .from("users")
        .upsert(baseProfile, { onConflict: "id" });

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Token-based flow (invite member signup)
    const { data: tokenData, error: tokenError } = await adminDb
      .from("signup_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (!tokenError && tokenData) {
      if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
        return NextResponse.json({ error: "Signup token expired" }, { status: 403 });
      }
      if (tokenData.used) {
        return NextResponse.json({ error: "Signup token already used" }, { status: 403 });
      }

      const { error: upsertError } = await adminDb.from("users").upsert(
        {
          ...baseProfile,
          plan_id: tokenData.plan_id ?? null,
          stripe_customer_id: tokenData.customer_id ?? null,
          stripe_subscription_id: tokenData.subscription_id ?? null,
        },
        { onConflict: "id" }
      );

      if (upsertError) throw upsertError;

      await adminDb
        .from("signup_tokens")
        .update({ used: true, used_at: new Date().toISOString(), used_by: uid })
        .eq("token", token);

      return NextResponse.json({ success: true });
    }

    // Fallback: service-role direct creation (admin-initiated invites)
    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (authUser.id !== uid) {
      return NextResponse.json(
        { error: "Authenticated user does not match requested profile id." },
        { status: 403 }
      );
    }

    if (
      authUser.email &&
      String(email).trim().toLowerCase() !== authUser.email.trim().toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Authenticated user email does not match requested profile email." },
        { status: 403 }
      );
    }

    const { error: fallbackError } = await adminDb
      .from("users")
      .upsert(baseProfile, { onConflict: "id" });

    if (fallbackError) throw fallbackError;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

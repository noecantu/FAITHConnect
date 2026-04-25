export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      uid,
      email,
      firstName,
      lastName,
      token,
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
      // Signup flow — verify the caller is the same user being created
      const authUser = await getServerUser();
      if (!authUser || authUser.id !== uid) {
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

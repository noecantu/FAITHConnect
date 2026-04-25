export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { churchName } = await req.json();

    if (!churchName) {
      return NextResponse.json({ error: "Missing churchName." }, { status: 400 });
    }

    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const uid = authUser.id;

    const { data: userData, error: userError } = await adminDb
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User profile not found. Please restart onboarding." },
        { status: 403 }
      );
    }

    if (userData.onboarding_step !== "create-church") {
      return NextResponse.json(
        { error: "Complete payment before creating your church." },
        { status: 403 }
      );
    }

    if (!userData.stripe_subscription_id) {
      return NextResponse.json(
        { error: "Active subscription required before church creation." },
        { status: 403 }
      );
    }

    const billingStatus = typeof userData.billing_status === "string" ? userData.billing_status : null;
    const hasHealthyBilling = billingStatus
      ? billingStatus === "active" || billingStatus === "trialing"
      : Boolean(userData.stripe_subscription_id);

    if (!hasHealthyBilling) {
      return NextResponse.json(
        { error: "Subscription is not in good standing. Please update billing." },
        { status: 403 }
      );
    }

    // Create slug
    const baseSlug = (churchName as string)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `church-${uid.slice(0, 6)}`;

    let finalSlug = baseSlug;
    let suffix = 1;

    while (true) {
      const { data: existing } = await adminDb
        .from("churches")
        .select("id")
        .eq("id", finalSlug)
        .maybeSingle();
      if (!existing) break;
      finalSlug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const now = new Date().toISOString();

    const { error: churchError } = await adminDb.from("churches").insert({
      id: finalSlug,
      slug: finalSlug,
      name: churchName,
      status: "pending",
      billing_owner_uid: uid,
      billing_contact_email: typeof userData.email === "string" ? userData.email : null,
      stripe_customer_id: userData.stripe_customer_id ?? null,
      stripe_subscription_id: userData.stripe_subscription_id ?? null,
      plan_id: userData.plan_id ?? null,
      billing_status: billingStatus,
      billing_delinquent: billingStatus == null ? null : !(billingStatus === "active" || billingStatus === "trialing"),
      billing_updated_at: now,
      created_by: uid,
    });

    if (churchError) throw churchError;

    // Update user with churchId and final onboarding step
    const { error: userUpdateError } = await adminDb
      .from("users")
      .update({
        church_id: finalSlug,
        onboarding_step: "done",
        onboarding_complete: true,
        roles: ["Admin"],
        roles_by_church: { [finalSlug]: ["Admin"] },
      })
      .eq("id", uid);

    if (userUpdateError) throw userUpdateError;

    return NextResponse.json({ success: true, slug: finalSlug });
  } catch (error) {
    console.error("Error creating church:", error);
    return NextResponse.json({ error: "Failed to create church" }, { status: 500 });
  }
}

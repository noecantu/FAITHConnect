import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/app/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ churchId: string }> }
) {
  const { churchId } = await params;

  if (!churchId) {
    return NextResponse.json({ error: "churchId is required" }, { status: 400 });
  }

  const { data, error } = await adminDb
    .from("churches")
    .select("*")
    .eq("id", churchId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching church:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Church not found" }, { status: 404 });
  }

  const normalized = {
    ...data,
    logoUrl: data.logo_url ?? null,
    leaderName: data.leader_name ?? null,
    leaderTitle: data.leader_title ?? null,
    billingStatus: data.billing_status ?? null,
    billingDelinquent: data.billing_delinquent ?? null,
    stripeCustomerId: data.stripe_customer_id ?? null,
    stripeSubscriptionId: data.stripe_subscription_id ?? null,
    planId: data.plan_id ?? null,
    billingOwnerUid: data.billing_owner_uid ?? null,
  };

  return NextResponse.json(normalized);
}

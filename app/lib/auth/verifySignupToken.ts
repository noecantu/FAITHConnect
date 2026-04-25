import { adminDb } from "@/app/lib/supabase/admin";

export async function verifySignupToken(token: string) {
  try {
    const { data, error } = await adminDb
      .from("signup_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !data) {
      return { valid: false, reason: "not_found" };
    }

    // Expiration check
    const now = Date.now();
    const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0;

    if (expiresAt < now) {
      return { valid: false, reason: "expired" };
    }

    // Already used
    if (data.used) {
      return { valid: false, reason: "used" };
    }

    return {
      valid: true,
      planId: data.plan_id,
      customerId: data.customer_id,
      subscriptionId: data.subscription_id,
    };
  } catch (err) {
    console.error("verifySignupToken error:", err);
    return { valid: false, reason: "error" };
  }
}

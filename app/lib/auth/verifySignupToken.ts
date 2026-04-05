import { db } from "@/app/lib/firebase/client";
import { doc, getDoc } from "firebase/firestore";

export async function verifySignupToken(token: string) {
  try {
    const ref = doc(db, "signupTokens", token);
    const snap = await getDoc(ref);

    // Token does not exist
    if (!snap.exists()) {
      return { valid: false, reason: "not_found" };
    }

    const data = snap.data();

    // Expiration check
    const now = Date.now();
    const expiresAt = data.expiresAt?.toMillis?.() ?? 0;

    if (expiresAt < now) {
      return { valid: false, reason: "expired" };
    }

    // Already used
    if (data.used) {
      return { valid: false, reason: "used" };
    }

    // Token is valid
    return {
      valid: true,
      planId: data.planId,
      customerId: data.customerId,
      subscriptionId: data.subscriptionId,
    };

  } catch (err) {
    console.error("verifySignupToken error:", err);
    return { valid: false, reason: "error" };
  }
}

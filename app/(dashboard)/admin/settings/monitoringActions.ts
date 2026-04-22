//app/(dashboard)/admin/settings/monitoringActions.ts
"use server";

import { getStorage } from "firebase-admin/storage";
import Stripe from "stripe";
import { adminDb } from "@/app/lib/firebase/admin";

export async function getStorageUsage() {
  const bucket = getStorage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
  const [files] = await bucket.getFiles();

  let totalBytes = 0;
  files.forEach(f => {
    if (f.metadata && f.metadata.size) {
      totalBytes += Number(f.metadata.size);
    }
  });

  return { totalBytes };
}

// export async function getDatabaseStats() {
//   const collections = await adminDb.listCollections();

//   const stats: Record<string, number> = {};

//   for (const col of collections) {
//     const snap = await col.get();
//     stats[col.id] = snap.size;
//   }

//   return stats;
// }

export async function getEmailProviderHealth() {
  const settingsSnap = await adminDb.doc("system/settings").get();
  const settings = (settingsSnap.data() ?? {}) as {
    emailProvider?: "sendgrid" | "mailgun" | "ses";
    disableEmailSending?: boolean;
  };

  const provider = settings.emailProvider ?? "sendgrid";
  const emailSendingDisabled = settings.disableEmailSending === true;

  const requiredEnvByProvider: Record<"sendgrid" | "mailgun" | "ses", string[]> = {
    sendgrid: ["SENDGRID_API_KEY"],
    mailgun: ["MAILGUN_API_KEY", "MAILGUN_DOMAIN"],
    ses: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"],
  };

  const requiredEnv = requiredEnvByProvider[provider] ?? [];
  const missingEnv = requiredEnv.filter((name) => {
    const value = process.env[name];
    return !value || value.trim().length === 0;
  });

  const status = emailSendingDisabled
    ? "disabled"
    : missingEnv.length === 0
      ? "healthy"
      : "misconfigured";

  return {
    provider,
    status,
    emailSendingDisabled,
    requiredEnv,
    missingEnv,
    lastChecked: new Date().toISOString(),
  };
}

export async function getStripeSyncStatus() {
  const now = new Date().toISOString();
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey || stripeKey.trim().length === 0) {
    return {
      status: "misconfigured",
      message: "Missing STRIPE_SECRET_KEY.",
      lastSync: now,
    };
  }

  try {
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const account = await stripe.accounts.retrieve();

    const usersSnap = await adminDb
      .collection("users")
      .select("stripeSubscriptionId")
      .get();

    const subscriptionIds = usersSnap.docs
      .map((docSnap) => {
        const data = docSnap.data() as { stripeSubscriptionId?: unknown };
        return typeof data.stripeSubscriptionId === "string" && data.stripeSubscriptionId.trim().length > 0
          ? data.stripeSubscriptionId
          : null;
      })
      .filter((value): value is string => Boolean(value));

    const sampleIds = Array.from(new Set(subscriptionIds)).slice(0, 10);

    const sampleStatuses = await Promise.all(
      sampleIds.map(async (subscriptionId) => {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          return { subscriptionId, status: sub.status, ok: sub.status === "active" || sub.status === "trialing" };
        } catch {
          return { subscriptionId, status: "error", ok: false };
        }
      })
    );

    const unhealthySampleCount = sampleStatuses.filter((s) => !s.ok).length;

    return {
      status: unhealthySampleCount > 0 ? "warning" : "ok",
      message: unhealthySampleCount > 0
        ? "Some sampled subscriptions are not active/trialing."
        : "Stripe API reachable and sampled subscriptions are healthy.",
      stripeAccountId: account.id,
      usersWithStoredSubscriptionId: subscriptionIds.length,
      sampledSubscriptions: sampleStatuses.length,
      unhealthySampleCount,
      sampleStatuses,
      lastSync: now,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown Stripe error",
      lastSync: now,
    };
  }
}

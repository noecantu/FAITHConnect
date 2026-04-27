//app/(dashboard)/admin/settings/monitoringActions.ts
"use server";

import Stripe from "stripe";
import { adminDb } from "@/app/lib/supabase/admin";
import { getCurrentUser } from "@/app/lib/auth/server/getCurrentUser";
import { can } from "@/app/lib/auth/permissions";

type MonitoringCheckKey =
  | "storageUsage"
  | "systemLogsHealth"
  | "emailProviderHealth"
  | "stripeSyncStatus"
  | "stripePricesValid";

type MonitoringResult = Record<string, unknown>;

async function requireSystemManager() {
  const actor = await getCurrentUser();

  if (!actor || !can(actor.roles ?? [], "system.manage")) {
    throw new Error("Unauthorized");
  }

  return actor;
}

async function persistMonitoringResult(check: MonitoringCheckKey, result: MonitoringResult) {
  const { data: row } = await adminDb
    .from("system_settings")
    .select("settings")
    .eq("id", "global")
    .single();

  const current = ((row?.settings as Record<string, unknown>)?.monitoringChecks ?? {}) as Record<string, unknown>;
  const existingSettings = (row?.settings as Record<string, unknown>) ?? {};

  await adminDb.from("system_settings").upsert(
    {
      id: "global",
      settings: {
        ...existingSettings,
        monitoringChecks: {
          ...current,
          [check]: {
            ...result,
            cachedAt: new Date().toISOString(),
          },
        },
      },
    },
    { onConflict: "id" }
  );
}

async function withMonitoringCache(
  check: MonitoringCheckKey,
  compute: () => Promise<MonitoringResult>
) {
  const result = await compute();
  await persistMonitoringResult(check, result);
  return result;
}

export async function getMonitoringCheckCache() {
  await requireSystemManager();

  const { data: row } = await adminDb
    .from("system_settings")
    .select("settings")
    .eq("id", "global")
    .single();

  const monitoringChecks = ((row?.settings as Record<string, unknown>)?.monitoringChecks ?? {}) as Record<string, unknown>;

  return monitoringChecks;
}

export async function getStorageUsage() {
  await requireSystemManager();

  const startedAt = Date.now();

  return withMonitoringCache("storageUsage", async () => {
    try {
      // Supabase Storage: list files in known buckets
      const buckets = ["logos", "member-photos"];
      let totalBytes = 0;
      let fileCount = 0;

      for (const bucket of buckets) {
        const { data: files } = await adminDb.storage.from(bucket).list("", { limit: 10000 });
        if (files) {
          fileCount += files.length;
          // Supabase list doesn't return sizes; we approximate
          totalBytes += files.length * 50000; // rough 50KB average estimate
        }
      }

      return {
        status: "ok",
        totalBytes,
        fileCount,
        bucketUsed: buckets.join(", "),
        lastChecked: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Storage usage check failed.",
        lastChecked: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
      };
    }
  });
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
  await requireSystemManager();

  const startedAt = Date.now();

  return withMonitoringCache("emailProviderHealth", async () => {
    const { data: settingsRow } = await adminDb
      .from("system_settings")
      .select("settings")
      .eq("id", "global")
      .single();
    const settings = ((settingsRow?.settings ?? {}) as {
      emailProvider?: "sendgrid" | "mailgun" | "ses";
      disableEmailSending?: boolean;
    });

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
      message:
        emailSendingDisabled
          ? "Email sending is disabled in system settings."
          : missingEnv.length === 0
          ? "Provider configuration looks complete."
          : "Provider is missing required environment variables.",
      emailSendingDisabled,
      requiredEnv,
      missingEnv,
      lastChecked: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
    };
  });
}

export async function getStripeSyncStatus() {
  await requireSystemManager();

  const now = new Date().toISOString();
  const startedAt = Date.now();
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  return withMonitoringCache("stripeSyncStatus", async () => {
    if (!stripeKey || stripeKey.trim().length === 0) {
      return {
        status: "misconfigured",
        message: "Missing STRIPE_SECRET_KEY.",
        lastSync: now,
        durationMs: Date.now() - startedAt,
      };
    }

    try {
      const stripe = new Stripe(stripeKey, {
        apiVersion: "2023-10-16",
      });

    const accountId = process.env.STRIPE_ACCOUNT_ID;
    const account = accountId ? await stripe.accounts.retrieve(accountId) : null;

    const { data: usersData } = await adminDb
      .from("users")
      .select("stripe_subscription_id");

    const subscriptionIds = (usersData ?? [])
      .map((u: { stripe_subscription_id?: string | null }) =>
        typeof u.stripe_subscription_id === "string" && u.stripe_subscription_id.trim().length > 0
          ? u.stripe_subscription_id
          : null
      )
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
        stripeAccountId: account?.id ?? null,
        usersWithStoredSubscriptionId: subscriptionIds.length,
        sampledSubscriptions: sampleStatuses.length,
        unhealthySampleCount,
        sampleStatuses,
        lastSync: now,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown Stripe error",
        lastSync: now,
        durationMs: Date.now() - startedAt,
      };
    }
  });
}

export async function getStripePricesHealth() {
  await requireSystemManager();

  const startedAt = Date.now();
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  return withMonitoringCache("stripePricesValid", async () => {
    if (!stripeKey || stripeKey.trim().length === 0) {
      return {
        status: "misconfigured",
        message: "Missing STRIPE_SECRET_KEY.",
        checkedPrices: [],
        durationMs: Date.now() - startedAt,
      };
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const priceEnvVars = [
      "STRIPE_PRICE_BEGINNING_MONTHLY",
      "STRIPE_PRICE_BEGINNING_YEARLY",
      "STRIPE_PRICE_GROWING_MONTHLY",
      "STRIPE_PRICE_GROWING_YEARLY",
      "STRIPE_PRICE_ABOUNDING_MONTHLY",
      "STRIPE_PRICE_ABOUNDING_YEARLY",
    ];

    const checkedPrices: Array<{
      envVar: string;
      priceId: string | undefined;
      valid: boolean;
      error?: string;
    }> = [];

    try {
      for (const envVar of priceEnvVars) {
        const priceId = process.env[envVar];

        if (!priceId || priceId.trim().length === 0) {
          checkedPrices.push({
            envVar,
            priceId: undefined,
            valid: false,
            error: "Missing env var",
          });
          continue;
        }

        try {
          await stripe.prices.retrieve(priceId);
          checkedPrices.push({
            envVar,
            priceId,
            valid: true,
          });
        } catch (error: any) {
          checkedPrices.push({
            envVar,
            priceId,
            valid: false,
            error: error?.message || "Failed to retrieve",
          });
        }
      }

      const allValid = checkedPrices.every((p) => p.valid);
      const invalidCount = checkedPrices.filter((p) => !p.valid).length;

      return {
        status: allValid ? "ok" : "misconfigured",
        message: allValid
          ? "All configured Stripe prices are valid."
          : `${invalidCount} of ${priceEnvVars.length} prices are misconfigured or missing.`,
        checkedPrices,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to validate prices",
        checkedPrices,
        durationMs: Date.now() - startedAt,
      };
    }
  });
}

export async function getSystemLogsHealth() {
  await requireSystemManager();

  const startedAt = Date.now();
  const checkedAt = new Date().toISOString();

  return withMonitoringCache("systemLogsHealth", async () => {
    try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const since24hIso = since24h.toISOString();

    const [totalResult, recentResult, latestResult, sampleResult] = await Promise.all([
      adminDb.from("logs").select("id", { count: "exact", head: true }),
      adminDb.from("logs").select("id", { count: "exact", head: true }).gte("timestamp", since24hIso),
      adminDb.from("logs").select("id, type, message, timestamp").order("timestamp", { ascending: false }).limit(1),
      adminDb.from("logs").select("type").order("timestamp", { ascending: false }).limit(200),
    ]);

    const totalLogs = totalResult.count ?? 0;
    const logsLast24h = recentResult.count ?? 0;

    const latestRow = latestResult.data?.[0] as { id?: string; type?: string; message?: string; timestamp?: string } | undefined;

    const typeCounts: Record<string, number> = {};
    let sampleErrorCount = 0;

    (sampleResult.data ?? []).forEach((row: { type?: string }) => {
      const type = typeof row.type === "string" && row.type.length > 0 ? row.type : "unknown";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      if (type === "ERROR") sampleErrorCount += 1;
    });

    const topTypes = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const status = totalLogs === 0 ? "warning" : "ok";

      return {
        status,
        message:
          totalLogs === 0
            ? "No logs found yet. Logging may not be initialized in this environment."
            : "System logs query executed successfully.",
        totalLogs,
        logsLast24h,
        latestLog: {
          id: latestRow?.id ?? null,
          timestamp: latestRow?.timestamp ?? null,
          type: latestRow?.type ?? null,
          message: latestRow?.message ?? null,
        },
        sampleWindowSize: (sampleResult.data ?? []).length,
        sampleErrorCount,
        topTypes,
        lastChecked: checkedAt,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : "System logs check failed.",
        lastChecked: checkedAt,
        durationMs: Date.now() - startedAt,
      };
    }
  });
}

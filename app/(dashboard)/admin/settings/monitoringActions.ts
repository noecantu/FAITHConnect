//app/(dashboard)/admin/settings/monitoringActions.ts
"use server";

import { getStorage } from "firebase-admin/storage";
import Stripe from "stripe";
import { adminDb } from "@/app/lib/firebase/admin";
import { getCurrentUser } from "@/app/lib/auth/server/getCurrentUser";
import { can } from "@/app/lib/auth/permissions";

type MonitoringCheckKey =
  | "storageUsage"
  | "systemLogsHealth"
  | "emailProviderHealth"
  | "stripeSyncStatus";

type MonitoringResult = Record<string, unknown>;

function resolveStorageBucketCandidates(): string[] {
  const rawCandidates = [
    process.env.FIREBASE_STORAGE_BUCKET,
    process.env.FIREBASE_ADMIN_STORAGE_BUCKET,
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  ];

  const normalized = new Set<string>();

  for (const raw of rawCandidates) {
    if (!raw) continue;
    const value = raw.replace(/^gs:\/\//, "").trim();
    if (!value) continue;
    normalized.add(value);

    if (value.endsWith(".appspot.com")) {
      normalized.add(value.replace(".appspot.com", ".firebasestorage.app"));
    }
    if (value.endsWith(".firebasestorage.app")) {
      normalized.add(value.replace(".firebasestorage.app", ".appspot.com"));
    }
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (projectId) {
    normalized.add(`${projectId}.appspot.com`);
    normalized.add(`${projectId}.firebasestorage.app`);
  }

  return Array.from(normalized);
}

async function requireSystemManager() {
  const actor = await getCurrentUser();

  if (!actor || !can(actor.roles ?? [], "system.manage")) {
    throw new Error("Unauthorized");
  }

  return actor;
}

async function persistMonitoringResult(check: MonitoringCheckKey, result: MonitoringResult) {
  const settingsRef = adminDb.doc("system/settings");
  const snap = await settingsRef.get();

  const current = (snap.data()?.monitoringChecks ?? {}) as Record<string, unknown>;

  await settingsRef.set(
    {
      monitoringChecks: {
        ...current,
        [check]: {
          ...result,
          cachedAt: new Date().toISOString(),
        },
      },
    },
    { merge: true }
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

  const snap = await adminDb.doc("system/settings").get();
  const monitoringChecks = (snap.data()?.monitoringChecks ?? {}) as Record<string, unknown>;

  return monitoringChecks;
}

export async function getStorageUsage() {
  await requireSystemManager();

  const startedAt = Date.now();

  return withMonitoringCache("storageUsage", async () => {
    try {
    const candidates = resolveStorageBucketCandidates();
    if (candidates.length === 0) {
      return {
        status: "misconfigured",
        message: "No Firebase storage bucket is configured.",
        lastChecked: new Date().toISOString(),
      };
    }

    let bucketUsed: string | null = null;
    let files: Array<{ metadata?: { size?: string } }> = [];

    for (const bucketName of candidates) {
      try {
        const bucket = getStorage().bucket(bucketName);
        const [bucketFiles] = await bucket.getFiles();
        bucketUsed = bucket.name;
        files = bucketFiles;
        break;
      } catch (error) {
        if (error instanceof Error && /bucket.*does not exist/i.test(error.message)) {
          continue;
        }
        throw error;
      }
    }

    if (!bucketUsed) {
      return {
        status: "misconfigured",
        message: "Configured storage bucket does not exist.",
        candidates,
        lastChecked: new Date().toISOString(),
      };
    }

    let totalBytes = 0;
    files.forEach((f) => {
      if (f.metadata && f.metadata.size) {
        totalBytes += Number(f.metadata.size);
      }
    });

    return {
      status: "ok",
      totalBytes,
      fileCount: files.length,
      bucketUsed,
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

export async function getSystemLogsHealth() {
  await requireSystemManager();

  const startedAt = Date.now();
  const checkedAt = new Date().toISOString();

  return withMonitoringCache("systemLogsHealth", async () => {
    try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalCountSnap, recentCountSnap, latestSnap, recentSampleSnap] = await Promise.all([
      adminDb.collection("systemLogs").count().get(),
      adminDb.collection("systemLogs").where("timestamp", ">=", since24h).count().get(),
      adminDb.collection("systemLogs").orderBy("timestamp", "desc").limit(1).get(),
      adminDb.collection("systemLogs").orderBy("timestamp", "desc").limit(200).get(),
    ]);

    const totalLogs = totalCountSnap.data().count ?? 0;
    const logsLast24h = recentCountSnap.data().count ?? 0;

    const latestDoc = latestSnap.docs[0];
    const latestData = latestDoc?.data() as
      | { type?: unknown; message?: unknown; timestamp?: { toDate?: () => Date } }
      | undefined;

    const latestTimestamp =
      latestData && latestData.timestamp && typeof latestData.timestamp.toDate === "function"
        ? latestData.timestamp.toDate().toISOString()
        : null;

    const latestType = typeof latestData?.type === "string" ? latestData.type : null;
    const latestMessage = typeof latestData?.message === "string" ? latestData.message : null;

    const typeCounts: Record<string, number> = {};
    let sampleErrorCount = 0;

    recentSampleSnap.docs.forEach((docSnap) => {
      const data = docSnap.data() as { type?: unknown };
      const type = typeof data.type === "string" && data.type.length > 0 ? data.type : "unknown";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
      if (type === "ERROR") {
        sampleErrorCount += 1;
      }
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
          id: latestDoc?.id ?? null,
          timestamp: latestTimestamp,
          type: latestType,
          message: latestMessage,
        },
        sampleWindowSize: recentSampleSnap.size,
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

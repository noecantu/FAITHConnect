//app/(dashboard)/admin/settings/monitoringActions.ts
"use server";

import { getStorage } from "firebase-admin/storage";

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
  // Placeholder — replace with real provider check later
  return {
    provider: "sendgrid",
    status: "healthy",
    lastChecked: new Date().toISOString()
  };
}

export async function getStripeSyncStatus() {
  // Placeholder — replace with real Stripe logic
  return {
    lastSync: new Date().toISOString(),
    status: "ok"
  };
}

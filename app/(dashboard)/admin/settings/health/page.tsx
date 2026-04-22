// app/admin/settings/health/page.tsx

import { adminDb, adminAuth } from "@/app/lib/firebase/admin";
import HealthDashboard from "./HealthDashboard";
import type { UserRecord, UserInfo } from "firebase-admin/auth";

export default async function HealthPage() {
  // Firestore stats (aggregate counts)
  const [usersCountSnap, churchesCountSnap, logsCountSnap] = await Promise.all([
    adminDb.collection("users").count().get(),
    adminDb.collection("churches").count().get(),
    adminDb.collection("systemLogs").count().get(),
  ]);

  // Auth stats (full pagination so counts are not capped)
  const authUsers = await listAllAuthUsers();
  const totalUsers = authUsers.length;

  // Log type distribution for chart (real, uncapped)
  const logTypeCounts = await getSystemLogTypeCounts();

  // Build metrics object
  const metrics = {
    firestore: {
      users: usersCountSnap.data().count ?? 0,
      churches: churchesCountSnap.data().count ?? 0,
      logs: logsCountSnap.data().count ?? 0,
    },
    auth: {
      totalUsers,
      providers: countProviders(authUsers),
    },
    logTypeCounts,
    generatedAt: new Date().toISOString(),
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Platform Health Dashboard</h1>
      <HealthDashboard metrics={metrics} />
    </div>
  );
}

function countProviders(users: UserRecord[]) {
  const providerCounts: Record<string, number> = {};

  users.forEach((u) => {
    u.providerData.forEach((p: UserInfo) => {
      providerCounts[p.providerId] = (providerCounts[p.providerId] || 0) + 1;
    });
  });

  return providerCounts;
}

async function listAllAuthUsers() {
  const users: UserRecord[] = [];
  let nextPageToken: string | undefined = undefined;

  do {
    const result = await adminAuth.listUsers(1000, nextPageToken);
    users.push(...result.users);
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  return users;
}

async function getSystemLogTypeCounts() {
  const logsSnap = await adminDb.collection("systemLogs").select("type").get();
  const counts: Record<string, number> = {};

  logsSnap.docs.forEach((docSnap) => {
    const data = docSnap.data() as { type?: unknown };
    const type = typeof data.type === "string" && data.type.trim().length > 0 ? data.type : "unknown";
    counts[type] = (counts[type] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

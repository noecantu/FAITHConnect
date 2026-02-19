// app/admin/settings/health/page.tsx

import { adminDb, adminAuth } from "@/lib/firebase/firebaseAdmin";
import HealthDashboard from "./HealthDashboard";
import { normalizeFirestore } from "@/lib/normalize";
import type { UserRecord, UserInfo } from "firebase-admin/auth";

export default async function HealthPage() {
  // Firestore stats
  const usersSnap = await adminDb.collection("users").get();
  const churchesSnap = await adminDb.collection("churches").get();
  const logsSnap = await adminDb.collection("systemLogs").limit(500).get();

  // Auth stats
  const authUsers = await adminAuth.listUsers(1000);
  const totalUsers = authUsers.users.length;

  // Normalize logs to avoid Timestamp serialization errors
  const normalizedLogs = logsSnap.docs.map((d) => ({
    id: d.id,
    ...normalizeFirestore(d.data()),
  }));

  // Build metrics object
  const metrics = {
    firestore: {
      users: usersSnap.size,
      churches: churchesSnap.size,
      logs: logsSnap.size,
    },
    auth: {
      totalUsers,
      providers: countProviders(authUsers.users),
    },
    logs: normalizedLogs, // ← SAFE
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

// app/admin/settings/health/page.tsx
export const dynamic = "force-dynamic";

import { adminDb } from "@/app/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import HealthDashboard from "./HealthDashboard";
import { 
  getStorageUsage, 
  getEmailProviderHealth, 
  getStripeSyncStatus,
  getStripePricesHealth 
} from "../monitoringActions";

export default async function HealthPage() {
  // DB stats (aggregate counts)
  const [usersResult, churchesResult, logsResult] = await Promise.all([
    adminDb.from("users").select("id", { count: "exact", head: true }),
    adminDb.from("churches").select("id", { count: "exact", head: true }),
    adminDb.from("logs").select("id", { count: "exact", head: true }),
  ]);

  // Auth stats
  const authUsers = await listAllAuthUsers();
  const totalUsers = authUsers.length;

  // Log type distribution for chart (real, uncapped)
  const logTypeCounts = await getSystemLogTypeCounts();

  // Health checks
  const [storageHealth, emailHealth, stripeSync, stripePrices] = await Promise.all([
    getStorageUsage(),
    getEmailProviderHealth(),
    getStripeSyncStatus(),
    getStripePricesHealth(),
  ]);

  // Build metrics object
  const metrics = {
    firestore: {
      users: usersResult.count ?? 0,
      churches: churchesResult.count ?? 0,
      logs: logsResult.count ?? 0,
    },
    auth: {
      totalUsers,
      providers: countProviders(authUsers),
    },
    logTypeCounts,
    storage: storageHealth,
    email: emailHealth,
    stripe: stripeSync,
    stripePrices: stripePrices,
    generatedAt: new Date().toISOString(),
  };

  return (
    <div className="p-6 space-y-8">
      <HealthDashboard metrics={metrics} />
    </div>
  );
}

function countProviders(users: Array<{ identities?: Record<string, unknown[]> }>) {
  const providerCounts: Record<string, number> = {};

  users.forEach((u) => {
    const identities = u.identities ?? {};
    Object.keys(identities).forEach((provider) => {
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    });
  });

  return providerCounts;
}

async function listAllAuthUsers() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const users: Array<{ identities?: Record<string, unknown[]> }> = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) break;
    users.push(...data.users as Array<{ identities?: Record<string, unknown[]> }>);
    if (data.users.length < perPage) break;
    page++;
  }

  return users;
}

async function getSystemLogTypeCounts() {
  const { data } = await adminDb
    .from("logs")
    .select("type")
    .order("created_at", { ascending: false })
    .limit(1000);

  const counts: Record<string, number> = {};
  (data ?? []).forEach((row: { type?: string }) => {
    const type = row.type || "unknown";
    counts[type] = (counts[type] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

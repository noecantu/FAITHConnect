// app/admin/settings/health/page.tsx

import { adminDb } from "@/app/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import HealthDashboard from "./HealthDashboard";

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
    generatedAt: new Date().toISOString(),
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Platform Health Dashboard</h1>
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
  const { data: logs } = await adminDb.from("logs").select("type");
  const counts: Record<string, number> = {};

  (logs ?? []).forEach((row: { type?: string }) => {
    const type = typeof row.type === "string" && row.type.trim().length > 0 ? row.type : "unknown";
    counts[type] = (counts[type] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

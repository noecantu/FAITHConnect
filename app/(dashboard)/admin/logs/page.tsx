import { adminDb } from "@/app/lib/supabase/admin";
import ActivityLogTable from "./ActivityLogTable";

export const dynamic = "force-dynamic";
import type { LogEntry } from "@/app/lib/types";

export default async function ActivityLogsPage() {
  const { data: rows } = await adminDb
    .from("logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const logs: LogEntry[] = (rows ?? []).map((r) => ({
    id: r.id,
    type: r.type,
    message: r.message,
    actorUid: r.actor_uid ?? null,
    actorName: r.actor_name ?? null,
    targetId: r.target_id ?? null,
    targetType: r.target_type ?? null,
    timestamp: r.created_at ?? null,
    before: r.before ?? null,
    after: r.after ?? null,
    metadata: r.metadata ?? null,
  }));

  return (
    <>
      <h1 className="text-2xl font-bold">Activity Logs</h1>
      <p className="text-muted-foreground">
        System-level audit trail of all administrative actions.
      </p>
      <ActivityLogTable logs={logs} />
    </>
  );
}

import { adminDb } from "@/app/lib/supabase/admin";
import ActivityLogTable from "./ActivityLogTable";

export default async function ActivityLogsPage() {
  const { data: logs } = await adminDb
    .from("logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(200);

  return (
    <>
      <h1 className="text-2xl font-bold">Activity Logs</h1>
      <p className="text-muted-foreground">
        System-level audit trail of all administrative actions.
      </p>
      <ActivityLogTable logs={logs ?? []} />
    </>
  );
}

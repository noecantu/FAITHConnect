// app/admin/logs/page.tsx

import { adminDb } from "@/app/lib/firebase/admin";
import ActivityLogTable from "./ActivityLogTable";
import { normalizeFirestore } from "@/app/lib/normalize";

export default async function ActivityLogsPage() {
  const snap = await adminDb
    .collection("systemLogs")
    .orderBy("timestamp", "desc")
    .limit(200)
    .get();

  const logs = snap.docs.map((d) => ({
    id: d.id,
    ...normalizeFirestore(d.data()),
  }));

  console.log("LOGS RECEIVED:", logs);

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

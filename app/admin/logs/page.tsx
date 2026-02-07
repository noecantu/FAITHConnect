// app/admin/logs/page.tsx

import { adminDb } from "@/lib/firebase/firebaseAdmin";
import ActivityLogTable from "./ActivityLogTable";
import { normalizeFirestore } from "@/lib/normalize";

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
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Activity Logs</h1>
      <p className="text-muted-foreground">
        System-level audit trail of all administrative actions.
      </p>

      <ActivityLogTable logs={logs} />
    </div>
  );
}

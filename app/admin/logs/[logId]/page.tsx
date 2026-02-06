// app/admin/logs/[logId]/page.tsx

import { adminDb } from "@/lib/firebase/firebaseAdmin";
import LogDetailView from "./LogDetailView";

export default async function LogDetailPage({ params }: { params: { logId: string } }) {
  const { logId } = params;

  const snap = await adminDb.collection("systemLogs").doc(logId).get();

  if (!snap.exists) {
    return <div className="p-6">Log entry not found.</div>;
  }

  const log = snap.data();

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Log Details</h1>
      <LogDetailView logId={logId} log={log} />
    </div>
  );
}

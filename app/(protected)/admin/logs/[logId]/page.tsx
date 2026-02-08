// app/admin/logs/[logId]/page.tsx

import { adminDb } from "@/lib/firebase/firebaseAdmin";
import LogDetailView from "./LogDetailView";
import { normalizeFirestore } from "@/lib/normalize";

export default async function LogDetailPage({
  params,
}: {
  params: Promise<{ logId: string }>;
}) {
  const resolved = await params;
  console.log("PARAMS RECEIVED:", resolved);

  const { logId } = resolved;

  // Guard against invalid IDs
  if (!logId || logId === "undefined" || logId === "null") {
    return <div className="p-6">Invalid log ID.</div>;
  }

  const snap = await adminDb.collection("systemLogs").doc(logId).get();

  if (!snap.exists) {
    return <div className="p-6">Log entry not found.</div>;
  }

  const log = normalizeFirestore(snap.data());

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Log Details</h1>
      <LogDetailView logId={logId} log={log} />
    </div>
  );
}

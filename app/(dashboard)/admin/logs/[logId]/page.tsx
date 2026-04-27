import { adminDb } from "@/app/lib/supabase/admin";
import LogDetailView from "./LogDetailView";

export default async function LogDetailPage({
  params,
}: {
  params: Promise<{ logId: string }>;
}) {
  const resolved = await params;
  const { logId } = resolved;

  if (!logId || logId === "undefined" || logId === "null") {
    return <div className="p-6">Invalid log ID.</div>;
  }

  const { data: log } = await adminDb
    .from("logs")
    .select("*")
    .eq("id", logId)
    .single();

  if (!log) {
    return <div className="p-6">Log entry not found.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Log Detail</h1>
      <LogDetailView logId={logId} log={{ id: logId, ...log }} />
    </div>
  );
}

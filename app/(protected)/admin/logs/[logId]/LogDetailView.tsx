"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import DiffViewer from "./DiffViewer";
import type { LogEntry } from "@/app/lib/types";

type FirestoreTimestamp = {
  seconds: number;
  nanoseconds?: number;
};

function toDate(
  value: Date | FirestoreTimestamp | string | null | undefined
): Date | null {
  if (!value) return null;

  // Already a JS Date
  if (value instanceof Date) return value;

  // Firestore Timestamp-like object
  if (
    typeof value === "object" &&
    "seconds" in value &&
    typeof value.seconds === "number"
  ) {
    return new Date(value.seconds * 1000);
  }

  // ISO string or other string
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

export default function LogDetailView({
  log,
}: {
  logId: string;
  log: LogEntry;
}) {
  const { type, message, actorName, actorUid, targetId, targetType, timestamp, before, after, metadata } = log;
  const ts = toDate(timestamp);

  return (
    <div className="space-y-6">

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>{type}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2 text-sm">
          <p><strong>Message:</strong> {message}</p>
          <p><strong>Actor:</strong> {actorName || actorUid}</p>
          <p><strong>Target:</strong> {targetType} — {targetId}</p>
          <p><strong>Timestamp:</strong> {ts ? ts.toLocaleString() : "—"}</p>
        </CardContent>
      </Card>

      {/* Diff Viewer */}
      {(before || after) && (
        <Card>
          <CardHeader>
            <CardTitle>Changes</CardTitle>
          </CardHeader>

          <CardContent>
            <DiffViewer before={before ?? {}} after={after ?? {}} />
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      {metadata && (
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>

          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

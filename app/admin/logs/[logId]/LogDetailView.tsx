"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import DiffViewer from "./DiffViewer";

export default function LogDetailView({ logId, log }: { logId: string; log: any }) {
  const { type, message, actorName, actorUid, targetId, targetType, timestamp, before, after, metadata } = log;

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
          <p><strong>Timestamp:</strong> {new Date(timestamp).toLocaleString()}</p>
        </CardContent>
      </Card>

      {/* Diff Viewer */}
      {(before || after) && (
        <Card>
          <CardHeader>
            <CardTitle>Changes</CardTitle>
          </CardHeader>

          <CardContent>
            <DiffViewer before={before} after={after} />
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

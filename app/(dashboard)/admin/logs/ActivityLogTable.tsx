"use client";

import { useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import type { LogEntry } from "@/app/lib/types";

function toDate(
  value: Date | { seconds: number } | string | null | undefined
): Date | null {
  if (!value) return null;

  // Already a JS Date
  if (value instanceof Date) return value;

  // Firestore Timestamp-like object
  if (typeof value === "object" && "seconds" in value) {
    return new Date(value.seconds * 1000);
  }

  // ISO string or other string
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

export default function ActivityLogTable({ logs }: { logs: LogEntry[] }) {
  const [search, setSearch] = useState("");

  const filtered = logs.filter((log) => {
    const text = `${log.type} ${log.message} ${log.actorName} ${log.targetId}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <Card>
      <CardContent className="p-4 space-y-4">

        {/* Search */}
        <Input
          placeholder="Search logs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Type</th><th className="p-2">Message</th><th className="p-2">Actor</th><th className="p-2">Target</th><th className="p-2">Timestamp</th><th className="p-2">Details</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="p-2 font-medium">{log.type}</td>
                  <td className="p-2">{log.message}</td>
                  <td className="p-2">{log.actorName || log.actorUid || "Unknown"}</td>
                  <td className="p-2">{log.targetId}</td>
                  <td className="p-2">
                    {toDate(log.timestamp)?.toLocaleString() ?? "—"}
                  </td>
                  <td className="p-2">
                    <a
                      href={`/admin/logs/${log.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </CardContent>
    </Card>
  );
}

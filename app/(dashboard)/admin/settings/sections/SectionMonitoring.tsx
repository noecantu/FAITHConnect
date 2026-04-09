"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { getStorageUsage, getDatabaseStats, getEmailProviderHealth, getStripeSyncStatus } from "../monitoringActions";

interface MonitoringCardProps {
  title: string;
  action: () => Promise<any>;
  formatter: (data: any) => string;
}

function MonitoringCard({ title, action, formatter }: MonitoringCardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function run() {
    setLoading(true);
    const data = await action();
    setResult(data);
    setLoading(false);
  }

  return (
    <div className="border p-4 rounded-md space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">{title}</h3>
        <Button onClick={run} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </div>

      {result && (
        <pre className="bg-black/20 p-3 rounded text-xs overflow-auto max-h-64">
          {formatter(result)}
        </pre>
      )}
    </div>
  );
}

export default function SectionMonitoring() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Logs & Monitoring</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        <MonitoringCard
          title="Storage Usage"
          action={getStorageUsage}
          formatter={(data) =>
            `${(data.totalBytes / 1024 / 1024).toFixed(2)} MB`
          }
        />

        <MonitoringCard
          title="Database Document Counts"
          action={getDatabaseStats}
          formatter={(data) => JSON.stringify(data, null, 2)}
        />

        <MonitoringCard
          title="Email Provider Health"
          action={getEmailProviderHealth}
          formatter={(data) => `${data.provider}: ${data.status}`}
        />

        <MonitoringCard
          title="Stripe Sync Status"
          action={getStripeSyncStatus}
          formatter={(data) => `Last Sync: ${data.lastSync}`}
        />

      </CardContent>
    </Card>
  );
}
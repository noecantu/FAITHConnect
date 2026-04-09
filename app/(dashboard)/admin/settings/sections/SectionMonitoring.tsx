//app/(dashboard)/admin/settings/sections/SectionMonitoring.tsx
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

import {
  getStorageUsage,
  // getDatabaseStats,
  getEmailProviderHealth,
  getStripeSyncStatus,
} from "../monitoringActions";

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
    <Card className="p-4">
      <CardHeader className="flex flex-row items-center justify-between p-0 mb-3">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <Button onClick={run} disabled={loading} size="sm">
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </CardHeader>

      {result && (
        <CardContent className="p-0">
          <pre className="bg-black/20 p-3 rounded text-xs overflow-auto max-h-64">
            {formatter(result)}
          </pre>
        </CardContent>
      )}
    </Card>
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
          formatter={(data) => `${(data.totalBytes / 1024 / 1024).toFixed(2)} MB`}
        />

        {/* <MonitoringCard
          title="Database Document Counts"
          action={getDatabaseStats}
          formatter={(data) => JSON.stringify(data, null, 2)}
        /> */}

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

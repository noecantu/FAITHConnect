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

type StatusTone = {
  label: string;
  badgeClass: string;
  borderClass: string;
};

function getStatusTone(status?: unknown): StatusTone | null {
  if (typeof status !== "string") return null;

  const normalized = status.toLowerCase();

  if (normalized === "ok" || normalized === "healthy") {
    return {
      label: normalized.toUpperCase(),
      badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40",
      borderClass: "border-emerald-500/30",
    };
  }

  if (normalized === "warning" || normalized === "misconfigured") {
    return {
      label: normalized === "misconfigured" ? "MISCONFIGURED" : "WARNING",
      badgeClass: "bg-amber-500/15 text-amber-300 border-amber-400/40",
      borderClass: "border-amber-500/30",
    };
  }

  if (normalized === "error") {
    return {
      label: "ERROR",
      badgeClass: "bg-rose-500/15 text-rose-300 border-rose-400/40",
      borderClass: "border-rose-500/30",
    };
  }

  if (normalized === "disabled") {
    return {
      label: "DISABLED",
      badgeClass: "bg-zinc-500/20 text-zinc-300 border-zinc-400/40",
      borderClass: "border-zinc-500/30",
    };
  }

  return {
    label: normalized.toUpperCase(),
    badgeClass: "bg-blue-500/15 text-blue-300 border-blue-400/40",
    borderClass: "border-blue-500/30",
  };
}

function MonitoringCard({ title, action, formatter }: MonitoringCardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const tone = getStatusTone(result?.status);
  const checkedAt = result?.lastChecked ?? result?.lastSync ?? null;
  const message = typeof result?.message === "string" ? result.message : null;

  async function run() {
    setLoading(true);
    const data = await action();
    setResult(data);
    setLoading(false);
  }

  return (
    <Card className={`p-4 border-white/15 ${tone?.borderClass ?? ""}`}>
      <CardHeader className="p-0 mb-3 space-y-3">
        <div className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <Button onClick={run} disabled={loading} size="sm">
            {loading ? "Loading…" : result ? "Recheck" : "Run Check"}
          </Button>
        </div>

        {tone && (
          <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone.badgeClass}`}>
            {tone.label}
          </span>
        )}
      </CardHeader>

      {result && (
        <CardContent className="p-0 space-y-2">
          {message && (
            <p className="text-xs text-muted-foreground">{message}</p>
          )}

          {checkedAt && (
            <p className="text-xs text-muted-foreground">
              Last checked: {new Date(checkedAt).toLocaleString()}
            </p>
          )}

          <pre className="bg-black/25 border border-white/10 p-3 rounded text-xs overflow-auto max-h-64">
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
          formatter={(data) => JSON.stringify(data, null, 2)}
        />

        <MonitoringCard
          title="Stripe Sync Status"
          action={getStripeSyncStatus}
          formatter={(data) => JSON.stringify(data, null, 2)}
        />
      </CardContent>
    </Card>
  );
}

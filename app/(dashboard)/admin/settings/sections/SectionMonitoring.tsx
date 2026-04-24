//app/(dashboard)/admin/settings/sections/SectionMonitoring.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

import {
  getStorageUsage,
  getMonitoringCheckCache,
  // getDatabaseStats,
  getEmailProviderHealth,
  getStripeSyncStatus,
  getStripePricesHealth,
  getSystemLogsHealth,
} from "../monitoringActions";
import { useToast } from "@/app/hooks/use-toast";

interface MonitoringCardProps {
  title: string;
  action: () => Promise<any>;
  formatter: (data: any) => ReactNode;
  initialResult?: unknown;
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

function MonitoringCard({ title, action, formatter, initialResult }: MonitoringCardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(initialResult ?? null);
  const [resultSource, setResultSource] = useState<"cache" | "live" | null>(
    initialResult ? "cache" : null
  );
  const { toast } = useToast();

  useEffect(() => {
    setResult(initialResult ?? null);
    setResultSource(initialResult ? "cache" : null);
  }, [initialResult]);

  const tone = getStatusTone(result?.status);
  const checkedAt = result?.lastChecked ?? result?.lastSync ?? null;
  const message = typeof result?.message === "string" ? result.message : null;

  async function run() {
    try {
      setLoading(true);
      const data = await action();
      setResult(data);
      setResultSource("live");
    } catch (error) {
      const description = error instanceof Error ? error.message : "Check failed.";
      toast({ title: "Monitoring check failed", description });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className={`p-4 border-white/15 ${tone?.borderClass ?? ""}`}>
      <CardHeader className="p-0 mb-3 space-y-3">
        <div className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
            {resultSource === "cache" && (
              <span className="inline-flex items-center rounded-full border border-blue-400/40 bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-300">
                Cached
              </span>
            )}
            {resultSource === "live" && (
              <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                Live
              </span>
            )}
          </div>
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

          <div className="bg-black/25 border border-white/10 p-3 rounded text-xs overflow-auto max-h-64 space-y-2">
            {formatter(result)}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function MonitoringRows({
  rows,
  raw,
}: {
  rows: Array<{ label: string; value: ReactNode }>;
  raw?: unknown;
}) {
  return (
    <>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="text-right font-medium break-all">{row.value}</span>
          </div>
        ))}
      </div>

      {raw && (
        <details className="pt-2 border-t border-white/10">
          <summary className="cursor-pointer text-muted-foreground">Raw payload</summary>
          <pre className="mt-2 whitespace-pre-wrap break-all text-[11px] text-muted-foreground">
            {JSON.stringify(raw, null, 2)}
          </pre>
        </details>
      )}
    </>
  );
}

export default function SectionMonitoring() {
  const [cachedChecks, setCachedChecks] = useState<Record<string, unknown>>({});

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const cache = await getMonitoringCheckCache();
        if (!mounted) return;
        setCachedChecks((cache ?? {}) as Record<string, unknown>);
      } catch {
        if (!mounted) return;
        setCachedChecks({});
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>System Logs & Monitoring</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <MonitoringCard
          title="Storage Usage"
          action={getStorageUsage}
          initialResult={cachedChecks.storageUsage}
          formatter={(data) => (
            <MonitoringRows
              rows={[
                {
                  label: "Storage Used",
                  value:
                    typeof data.totalBytes === "number"
                      ? `${(data.totalBytes / 1024 / 1024).toFixed(2)} MB`
                      : "Unknown",
                },
                { label: "Files", value: data.fileCount ?? "Unknown" },
                { label: "Bucket", value: data.bucketUsed ?? "Unknown" },
                { label: "Duration", value: data.durationMs ? `${data.durationMs} ms` : "Unknown" },
              ]}
              raw={data}
            />
          )}
        />

        <MonitoringCard
          title="System Logs Health"
          action={getSystemLogsHealth}
          initialResult={cachedChecks.systemLogsHealth}
          formatter={(data) => (
            <MonitoringRows
              rows={[
                { label: "Total Logs", value: data.totalLogs ?? 0 },
                { label: "Logs (24h)", value: data.logsLast24h ?? 0 },
                { label: "Errors in Sample", value: data.sampleErrorCount ?? 0 },
                { label: "Sample Size", value: data.sampleWindowSize ?? 0 },
                { label: "Latest Type", value: data.latestLog?.type ?? "Unknown" },
                {
                  label: "Latest Timestamp",
                  value: data.latestLog?.timestamp
                    ? new Date(data.latestLog.timestamp).toLocaleString()
                    : "Unknown",
                },
              ]}
              raw={data}
            />
          )}
        />

        {/* <MonitoringCard
          title="Database Document Counts"
          action={getDatabaseStats}
          formatter={(data) => JSON.stringify(data, null, 2)}
        /> */}

        <MonitoringCard
          title="Email Provider Health"
          action={getEmailProviderHealth}
          initialResult={cachedChecks.emailProviderHealth}
          formatter={(data) => (
            <MonitoringRows
              rows={[
                { label: "Provider", value: data.provider ?? "Unknown" },
                { label: "Email Sending", value: data.emailSendingDisabled ? "Disabled" : "Enabled" },
                {
                  label: "Missing Config",
                  value: Array.isArray(data.missingEnv) ? data.missingEnv.length : 0,
                },
                {
                  label: "Required Vars",
                  value: Array.isArray(data.requiredEnv) && data.requiredEnv.length > 0
                    ? data.requiredEnv.join(", ")
                    : "None",
                },
                { label: "Duration", value: data.durationMs ? `${data.durationMs} ms` : "Unknown" },
              ]}
              raw={data}
            />
          )}
        />

      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Stripe</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <MonitoringCard
          title="Stripe Prices Configuration"
          action={getStripePricesHealth}
          initialResult={cachedChecks.stripePricesValid}
          formatter={(data) => {
            const priceList = Array.isArray(data.checkedPrices)
              ? data.checkedPrices.map((p: any) => (
                  <div key={p.envVar} className="text-[10px] space-y-0.5">
                    <div className="font-semibold">{p.envVar}</div>
                    <div className="text-muted-foreground">
                      {p.valid ? (
                        <span className="text-emerald-300">✓ Valid: {p.priceId}</span>
                      ) : (
                        <span className="text-rose-300">
                          ✗ {p.error} {p.priceId && `(${p.priceId})`}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              : "No prices checked";

            return (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">Checked Prices</span>
                    <span className="font-medium">
                      {Array.isArray(data.checkedPrices)
                        ? data.checkedPrices.filter((p: any) => p.valid).length
                        : 0}
                      /{Array.isArray(data.checkedPrices) ? data.checkedPrices.length : 0}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">
                      {data.durationMs ? `${data.durationMs} ms` : "Unknown"}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10 space-y-1">{priceList}</div>
              </>
            );
          }}
        />

        <MonitoringCard
          title="Stripe Sync Status"
          action={getStripeSyncStatus}
          initialResult={cachedChecks.stripeSyncStatus}
          formatter={(data) => (
            <MonitoringRows
              rows={[
                { label: "Stripe Account", value: data.stripeAccountId ?? "Unknown" },
                {
                  label: "Users With Subscription IDs",
                  value: data.usersWithStoredSubscriptionId ?? 0,
                },
                { label: "Sampled Subscriptions", value: data.sampledSubscriptions ?? 0 },
                { label: "Unhealthy in Sample", value: data.unhealthySampleCount ?? 0 },
                { label: "Duration", value: data.durationMs ? `${data.durationMs} ms` : "Unknown" },
              ]}
              raw={data}
            />
          )}
        />
      </CardContent>
    </Card>
    </>
  );
}

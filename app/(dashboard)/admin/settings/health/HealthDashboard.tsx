"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { AlertCircle, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { HealthMetrics } from "@/app/lib/types";

export default function HealthDashboard({
  metrics,
}: {
  metrics: HealthMetrics & {
    storage?: Record<string, unknown>;
    email?: Record<string, unknown>;
    stripe?: Record<string, unknown>;
    stripePrices?: Record<string, unknown>;
  };
}) {
  const providerData = Object.entries(metrics.auth.providers).map(([provider, count]) => ({
    provider,
    count,
  }));

  const logTypeCounts = metrics.logTypeCounts;
  const generatedAt = new Date(metrics.generatedAt);

  // Extract health statuses
  const emailStatus = (metrics.email?.status as string) || "unknown";
  const stripeStatus = (metrics.stripe?.status as string) || "unknown";
  const storageStatus = (metrics.storage?.status as string) || "unknown";

  const alerts = [
    ...(emailStatus === "disabled" ? [{ type: "warning", title: "Email Sending Disabled", msg: metrics.email?.message }] : []),
    ...(emailStatus === "misconfigured" ? [{ type: "error", title: "Email Provider Misconfigured", msg: "Missing environment variables" }] : []),
    ...(stripeStatus === "error" ? [{ type: "error", title: "Stripe Connection Failed", msg: metrics.stripe?.message }] : []),
    ...(stripeStatus === "warning" ? [{ type: "warning", title: "Stripe Sync Warning", msg: metrics.stripe?.message }] : []),
    ...(storageStatus === "error" ? [{ type: "error", title: "Storage Access Error", msg: metrics.storage?.message }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Health Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Last updated: {generatedAt.toLocaleString()}</p>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="border-red-900/20 bg-red-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert, idx) => (
              <div key={idx} className="flex gap-3 p-3 bg-white/5 rounded border border-red-900/20">
                {alert.type === "error" ? (
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold text-sm">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">{alert.msg}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Email Provider */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Email Provider</span>
              {emailStatus === "healthy" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : emailStatus === "disabled" ? (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>
              <p className="text-muted-foreground">Provider</p>
              <p className="font-semibold capitalize">{metrics.email?.provider || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-semibold capitalize">{emailStatus}</p>
            </div>
          </CardContent>
        </Card>

        {/* Stripe Sync */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Stripe Sync</span>
              {stripeStatus === "ok" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : stripeStatus === "warning" ? (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>
              <p className="text-muted-foreground">Subscriptions</p>
              <p className="font-semibold">{metrics.stripe?.usersWithStoredSubscriptionId || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sampled Healthy</p>
              <p className="font-semibold">
                {(metrics.stripe?.sampledSubscriptions || 0) - (metrics.stripe?.unhealthySampleCount || 0)}/
                {metrics.stripe?.sampledSubscriptions || 0}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Storage</span>
              {storageStatus === "ok" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>
              <p className="text-muted-foreground">Files</p>
              <p className="font-semibold">{metrics.storage?.fileCount || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Used</p>
              <p className="font-semibold">{formatBytes(metrics.storage?.totalBytes as number || 0)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Database */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Database</span>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div>
              <p className="text-muted-foreground">Tables</p>
              <p className="font-semibold">3</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Records</p>
              <p className="font-semibold">{(metrics.firestore.users + metrics.firestore.churches + metrics.firestore.logs).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Firestore Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Database Overview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Users</span>
              <span className="font-semibold text-lg">{metrics.firestore.users.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Churches</span>
              <span className="font-semibold text-lg">{metrics.firestore.churches.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">System Logs</span>
              <span className="font-semibold text-lg">{metrics.firestore.logs.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="text-muted-foreground">Auth Users (Supabase)</span>
              <span className="font-semibold text-lg">{metrics.auth.totalUsers.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Auth Provider Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Auth Providers</CardTitle>
          </CardHeader>
          <CardContent style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={providerData}
                  dataKey="count"
                  nameKey="provider"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {providerData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Log Types Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>System Log Activity</CardTitle>
          <p className="text-xs text-muted-foreground">Last 1000 logs by type</p>
        </CardHeader>
        <CardContent style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={logTypeCounts}>
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--chart-1))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

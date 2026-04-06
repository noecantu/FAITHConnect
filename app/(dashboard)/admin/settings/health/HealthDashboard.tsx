"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { HealthMetrics } from "@/app/lib/types";
import type { LogEntry } from "@/app/lib/types";

export default function HealthDashboard({
  metrics,
}: {
  metrics: HealthMetrics;
}) {
  const providerData = Object.entries(metrics.auth.providers).map(([provider, count]) => ({
    provider,
    count,
  }));

  const logTypeCounts = countLogTypes(metrics.logs);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Firestore Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Firestore Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>Users:</strong> {metrics.firestore.users}</p>
          <p><strong>Churches:</strong> {metrics.firestore.churches}</p>
          <p><strong>System Logs:</strong> {metrics.firestore.logs}</p>
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

      {/* Log Types Bar Chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>System Log Activity</CardTitle>
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

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function countLogTypes(logs: LogEntry[]) {
  const counts: Record<string, number> = {};

  logs.forEach((log) => {
    counts[log.type] = (counts[log.type] || 0) + 1;
  });

  return Object.entries(counts).map(([type, count]) => ({ type, count }));
}

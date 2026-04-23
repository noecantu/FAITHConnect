"use client";

import Link from "next/link";
import {
  Card,
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
} from "@/app/components/ui/card";

export default function AdminHomeClient({
  churchCount,
  userCount,
  adminCount,
  eventCount,
  checkinCount,
  musicItemCount,
  setlistCount,
  churchLeaderCount,
  financeCount,
}: {
  churchCount: number;
  userCount: number;
  adminCount: number;
  eventCount: number;
  checkinCount: number;
  musicItemCount: number;
  setlistCount: number;
  churchLeaderCount: number;
  financeCount: number;
}) {
  const renderStat = (value: number | null) => {
    if (value === -1) return "Error";
    return value;
  };

  return (
    <>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          FAITH Connect — MASTER ADMIN
        </h1>
        <p className="text-muted-foreground mt-1">
          System-wide overview and administrative tools.
        </p>
      </div>

      {/* System Overview */}
      <section>
        <h2 className="text-xl font-semibold mb-4">System Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Churches</CardTitle>
              <CardDescription>All churches in the system.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{renderStat(churchCount)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Users across all churches.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{renderStat(userCount)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admins</CardTitle>
              <CardDescription>Church Administrators</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{renderStat(adminCount)}</p>
            </CardContent>
          </Card>
          <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>Events: all churches.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{eventCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Check-ins</CardTitle>
            <CardDescription>Attendance: all churches.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{checkinCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Music Items</CardTitle>
            <CardDescription>All songs in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{musicItemCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setlists</CardTitle>
            <CardDescription>All worship setlists.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{setlistCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Church Leaders</CardTitle>
            <CardDescription>Churches with leader info.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{churchLeaderCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Finance Managers</CardTitle>
            <CardDescription>Users with the Finance role.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{financeCount}</p>
          </CardContent>
        </Card>
        </div>
      </section>

      {/* Management Tools */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Management Tools</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Link href="/admin/churches" className="group block">
            <Card className="p-6 cursor-pointer interactive-card interactive-card-focus">
              <CardTitle className="text-xl mb-2">Churches</CardTitle>
              <CardDescription>
                Create, edit, and manage all churches.
              </CardDescription>
            </Card>
          </Link>

          <Link href="/admin/users" className="group block">
            <Card className="p-6 cursor-pointer interactive-card interactive-card-focus">
              <CardTitle className="text-xl mb-2">System Users</CardTitle>
              <CardDescription>
                View and manage system-level users.
              </CardDescription>
            </Card>
          </Link>

          <Link href="/admin/settings" className="group block">
            <Card className="p-6 cursor-pointer interactive-card interactive-card-focus">
              <CardTitle className="text-xl mb-2">System Settings</CardTitle>
              <CardDescription>
                Global configuration and platform settings.
              </CardDescription>
            </Card>
          </Link>

          <Link href="/admin/logs" className="group block">
            <Card className="p-6 cursor-pointer interactive-card interactive-card-focus">
              <CardTitle className="text-xl mb-2">Activity Logs</CardTitle>
              <CardDescription>
                System-wide events and audit trails.
              </CardDescription>
            </Card>
          </Link>

          <Link href="/admin/settings/health" className="group block">
            <Card className="p-6 cursor-pointer interactive-card interactive-card-focus">
              <CardTitle className="text-xl mb-2">Platform Health</CardTitle>
              <CardDescription>
                Performance, Metrics, and Health.
              </CardDescription>
            </Card>
          </Link>

          <Link href="/admin/subscription-audit" className="group block">
            <Card className="p-6 cursor-pointer interactive-card interactive-card-focus">
              <CardTitle className="text-xl mb-2">Subscription Audit</CardTitle>
              <CardDescription>
                Verify all valid active subscriptions.
              </CardDescription>
            </Card>
          </Link>

        </div>
      </section>
    </>
  );
}
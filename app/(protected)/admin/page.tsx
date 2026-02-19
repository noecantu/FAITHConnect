"use client";

import Link from "next/link";
import {
  Card,
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
} from "../../components/ui/card";

export default function AdminHomeClient({
  churchCount,
  userCount,
  adminCount,
}: {
  churchCount: number;
  userCount: number;
  adminCount: number;
}) {
  const renderStat = (value: number | null) => {
    if (value === -1) return "Error";
    return value;
  };

  return (
    <div className="p-6 space-y-10">

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
              <CardTitle>Total Churches</CardTitle>
              <CardDescription>All churches in the system.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{renderStat(churchCount)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Users</CardTitle>
              <CardDescription>All users across all churches.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{renderStat(userCount)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Admins</CardTitle>
              <CardDescription>Church Administrators</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{renderStat(adminCount)}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Management Tools */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Management Tools</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Link href="/admin/churches">
            <Card className="p-6 hover:shadow-md transition cursor-pointer">
              <CardTitle className="text-xl mb-2">Churches</CardTitle>
              <CardDescription>
                Create, edit, and manage all churches.
              </CardDescription>
            </Card>
          </Link>

          <Link href="/admin/users">
            <Card className="p-6 hover:shadow-md transition cursor-pointer">
              <CardTitle className="text-xl mb-2">Users</CardTitle>
              <CardDescription>
                View and manage system-level users.
              </CardDescription>
            </Card>
          </Link>

          <Link href="/admin/settings">
            <Card className="p-6 hover:shadow-md transition cursor-pointer">
              <CardTitle className="text-xl mb-2">System Settings</CardTitle>
              <CardDescription>
                Global configuration and platform settings.
              </CardDescription>
            </Card>
          </Link>

          <Link href="/admin/logs">
            <Card className="p-6 hover:shadow-md transition cursor-pointer">
              <CardTitle className="text-xl mb-2">Activity Logs</CardTitle>
              <CardDescription>
                System-wide events and audit trails.
              </CardDescription>
            </Card>
          </Link>

          <Link href="/admin/settings/health">
            <Card className="p-6 hover:shadow-md transition cursor-pointer">
              <CardTitle className="text-xl mb-2">Platform Health</CardTitle>
              <CardDescription>
                System performance, usage metrics, and operational health.
              </CardDescription>
            </Card>
          </Link>

        </div>
      </section>
    </div>
  );
}
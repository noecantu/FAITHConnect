"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/app/lib/firebase";
import {
  collection,
  getCountFromServer,
  query,
  where,
} from "firebase/firestore";

import {
  Card,
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
} from "../components/ui/card";

export default function AdminHomePage() {
  const [churchCount, setChurchCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [adminCount, setAdminCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const churchesRef = collection(db, "churches");
        const churchesSnap = await getCountFromServer(churchesRef);
        setChurchCount(churchesSnap.data().count);
      } catch (err) {
        console.error("Church count ERROR:", err);
        setChurchCount(-1);
      }

      try {
        const usersRef = collection(db, "users");
        const usersSnap = await getCountFromServer(usersRef);
        setUserCount(usersSnap.data().count);

        const adminsQuery = query(
          usersRef,
          where("roles", "array-contains", "Admin")
        );
        const adminsSnap = await getCountFromServer(adminsQuery);
        setAdminCount(adminsSnap.data().count);
      } catch (err) {
        console.error("User/Admin count ERROR:", err);
        setUserCount(-1);
        setAdminCount(-1);
      }

      setLoading(false);
    }

    load();
  }, []);

  const renderStat = (value: number | null) => {
    if (loading) return "…";
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

        </div>
      </section>
    </div>
  );
}

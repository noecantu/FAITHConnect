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
  const [churchCount, setChurchCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Churches
      const churchesRef = collection(db, "churches");
      const churchesSnap = await getCountFromServer(churchesRef);
      setChurchCount(churchesSnap.data().count);

      // Users
      const usersRef = collection(db, "users");
      const usersSnap = await getCountFromServer(usersRef);
      setUserCount(usersSnap.data().count);

      // Admins
      const adminsQuery = query(usersRef, where("roles", "array-contains", "Admin"));
      const adminsSnap = await getCountFromServer(adminsQuery);
      setAdminCount(adminsSnap.data().count);

      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="p-6 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">FAITH Connect — Master Admin</h1>
        <p className="text-muted-foreground mt-1">
          System-wide overview and administrative tools
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Total Churches</CardTitle>
            <CardDescription>All churches in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{loading ? "…" : churchCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
            <CardDescription>All users across all churches</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{loading ? "…" : userCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Total Admins</CardTitle>
            <CardDescription>Church administrators</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{loading ? "…" : adminCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Grid (your existing cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Link href="/admin/churches">
          <Card className="p-6 bg-card text-card-foreground hover:shadow-md transition cursor-pointer">
            <CardTitle className="text-xl mb-2">Churches</CardTitle>
            <CardDescription>
              Create, edit, and manage all churches.
            </CardDescription>
          </Card>
        </Link>

        <Link href="/admin/users">
          <Card className="p-6 bg-card text-card-foreground hover:shadow-md transition cursor-pointer">
            <CardTitle className="text-xl mb-2">Users</CardTitle>
            <CardDescription>
              View and manage system-level users.
            </CardDescription>
          </Card>
        </Link>

        <Link href="/admin/settings">
          <Card className="p-6 bg-card text-card-foreground hover:shadow-md transition cursor-pointer">
            <CardTitle className="text-xl mb-2">System Settings</CardTitle>
            <CardDescription>
              Global configuration and platform settings.
            </CardDescription>
          </Card>
        </Link>

        <Link href="/admin/logs">
          <Card className="p-6 bg-card text-card-foreground hover:shadow-md transition cursor-pointer">
            <CardTitle className="text-xl mb-2">Activity Logs</CardTitle>
            <CardDescription>
              System-wide events and audit trails.
            </CardDescription>
          </Card>
        </Link>

      </div>
    </div>
  );
}

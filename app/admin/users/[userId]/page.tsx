"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { deleteDoc, doc, getDoc } from "firebase/firestore";

import { PageHeader } from "@/app/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ROLE_MAP, Role } from "@/app/lib/roles";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/app/components/ui/alert-dialog";

type UserRecord = {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  roles: Role[];
  churchId?: string;
  createdAt?: string;
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
    const userIdRaw = params?.userId;
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);


    const userIdStr = Array.isArray(userIdRaw)
    ? userIdRaw[0]
    : userIdRaw;

    if (!userIdStr || typeof userIdStr !== "string") {
    console.error("Invalid userId param");
    return null;
    }

    const userIdSafe: string = userIdStr;

  const [user, setUser] = useState<UserRecord | null>(null);
  const [churchName, setChurchName] = useState<string>("Loading…");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userIdSafe || typeof userIdSafe !== "string") return;

    async function load() {
      setLoading(true);

      // Load user
      const userRef = doc(db, "users", userIdSafe);
        const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setUser(null);
        setLoading(false);
        return;
      }

      const data = userSnap.data() as any;

      const userData: UserRecord = {
        id: userSnap.id,
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        email: data.email ?? "",
        roles: Array.isArray(data.roles) ? data.roles : [],
        churchId: data.churchId ?? "",
        createdAt: data.createdAt ?? "",
      };

      setUser(userData);

      // Load church name
      if (userData.churchId) {
        const churchRef = doc(db, "churches", userData.churchId);
        const churchSnap = await getDoc(churchRef);
        setChurchName(
          churchSnap.exists()
            ? (churchSnap.data() as any).name ?? "(Unnamed Church)"
            : "Unknown Church"
        );
      } else {
        setChurchName("Unassigned");
      }

      setLoading(false);
    }

    load();
  }, [userIdSafe]);

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="User Details" subtitle="Loading user…" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 space-y-4">
        <PageHeader title="User Not Found" subtitle="This user does not exist." />
        <Button onClick={() => router.push("/admin/users")}>Back to Users</Button>
      </div>
    );
  }

  const fullName =
    user.firstName || user.lastName
      ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
      : "(No name)";

    async function handleDeleteUser() {
        if (!user) return;

        try {
            setDeleting(true);

            // Delete Firestore user document
            await deleteDoc(doc(db, "users", user.id));

            // Optionally delete from Firebase Auth (requires privileged backend)
            // await deleteUser(authUser);

            router.push("/admin/users");
        } catch (err) {
            console.error("Failed to delete user:", err);
        } finally {
            setDeleting(false);
        }
    }

    return (
    <div className="p-6 space-y-8">
        <PageHeader
        title={fullName}
        subtitle="System-level user details"
        />

        <Card>
        <CardHeader>
            <CardTitle>User Information</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

            {/* Email */}
            <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
            </div>

            {/* Church */}
            <div>
            <p className="text-sm text-muted-foreground">Church</p>
            <p className="font-medium">{churchName}</p>
            </div>

            {/* Roles */}
            <div>
            <p className="text-sm text-muted-foreground">Roles</p>
            <p className="font-medium">
                {user.roles.length
                ? user.roles.map((r) => ROLE_MAP[r]).join(", ")
                : "No roles assigned"}
            </p>
            </div>

            {/* Created */}
            <div>
            <p className="text-sm text-muted-foreground">Created</p>
            <p className="font-medium">
                {user.createdAt
                ? new Date(user.createdAt).toLocaleString()
                : "—"}
            </p>
            </div>

        </CardContent>
        </Card>

        {/* Actions */}
        <div
            className="
                flex flex-col sm:flex-row
                justify-end
                gap-2
            "
            >
            <Button
                onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                className="w-full sm:w-auto"
            >
                Edit User
            </Button>

            <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto"
            >
                Delete User
            </Button>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
                Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
                Cancel
            </AlertDialogCancel>

            <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleting}
                onClick={handleDeleteUser}
            >
                {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
    </div>
    );

}

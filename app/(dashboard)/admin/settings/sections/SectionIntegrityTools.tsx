//app/(dashboard)/admin/settings/sections/SectionIntegrityTools.tsx
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  scanForStrayUsers,
  deleteStrayUser,
  scanForOrphanedMembers,
  deleteOrphanedMember,
  scanForChurchesWithoutAdmins,
  scanForInvalidRoles,
  repairInvalidUserRoles,
  normalizeUserUids,
} from "../integrityActions";
import { useToast } from "@/app/hooks/use-toast";

type StrayUser = {
  uid: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  churchId?: string;
  roles?: string[];
};

type OrphanedMember = {
  churchId: string;
  churchName?: string;
  memberId: string;
  memberName?: string;
  linkedUserId?: string | null;
  reason?: "inactive-church" | "missing-user-link" | "dangling-user-link";
};

type ChurchWithoutAdmin = {
  id: string;
  name?: string;
  status?: string;
};

type InvalidRoleUser = {
  uid: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  invalidRoles?: string[];
  validRoles?: string[];
};

interface IntegrityToolProps {
  title: string;
  description: string;
  action: () => Promise<unknown>;
  actionLabel?: string;
}

function IntegrityTool({ title, description, action, actionLabel = "Run Scan" }: IntegrityToolProps) {
  const [results, setResults] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function run() {
    try {
      setLoading(true);
      const data = await action();
      setResults(data);
      toast({
        title,
        description: "Action completed successfully.",
      });
    } catch (error) {
      const description = error instanceof Error ? error.message : "Action failed.";
      toast({
        title: "Action failed",
        description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border p-4 rounded-md space-y-2">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button onClick={run} disabled={loading}>
          {loading ? "Running…" : actionLabel}
        </Button>
      </div>

      {results && (
        <pre className="bg-black/20 p-3 rounded text-xs overflow-auto max-h-64">
          {JSON.stringify(results, null, 2)}
        </pre>
      )}
    </div>
  );
}

function StrayUsersTool() {
  const [results, setResults] = useState<StrayUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const { toast } = useToast();

  async function run() {
    try {
      setLoading(true);
      const data = await scanForStrayUsers();
      setResults(Array.isArray(data) ? (data as StrayUser[]) : []);
      toast({
        title: "Stray Users",
        description: "Scan completed successfully.",
      });
    } catch (error) {
      const description = error instanceof Error ? error.message : "Action failed.";
      toast({
        title: "Action failed",
        description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(user: StrayUser) {
    const label = user.email || user.uid;
    const confirmed = window.confirm(`Delete stray user ${label}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingUid(user.uid);
      await deleteStrayUser(user.uid);
      setResults((prev) => prev.filter((item) => item.uid !== user.uid));
      toast({
        title: "User deleted",
        description: `${label} has been removed.`,
      });
    } catch (error) {
      const description = error instanceof Error ? error.message : "Delete failed.";
      toast({
        title: "Delete failed",
        description,
        variant: "destructive",
      });
    } finally {
      setDeletingUid(null);
    }
  }

  return (
    <div className="border p-4 rounded-md space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Stray Users</h3>
          <p className="text-sm text-muted-foreground">
            Users with missing/invalid church links or no valid role assignments.
          </p>
        </div>
        <Button onClick={run} disabled={loading}>
          {loading ? "Running…" : "Run Scan"}
        </Button>
      </div>

      {!loading && results.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Found {results.length} stray user{results.length === 1 ? "" : "s"}.
        </p>
      )}

      {!loading && results.length === 0 && (
        <p className="text-sm text-muted-foreground">No scan results yet.</p>
      )}

      {results.length > 0 && (
        <div className="space-y-2 max-h-72 overflow-auto pr-1">
          {results.map((user) => {
            const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
            const displayName = fullName || "Unnamed user";
            const roles = Array.isArray(user.roles) && user.roles.length > 0
              ? user.roles.join(", ")
              : "No roles";

            return (
              <div
                key={user.uid}
                className="rounded-md border border-border/70 bg-black/10 p-3 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{displayName}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email || "No email"}</p>
                  <p className="text-xs text-muted-foreground mt-1">UID: {user.uid}</p>
                  <p className="text-xs text-muted-foreground">Roles: {roles}</p>
                  <p className="text-xs text-muted-foreground">
                    Church: {user.churchId || "Missing churchId"}
                  </p>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(user)}
                  disabled={deletingUid === user.uid}
                >
                  {deletingUid === user.uid ? "Deleting..." : "Delete"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrphanedMembersTool() {
  const [results, setResults] = useState<OrphanedMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const { toast } = useToast();

  async function run() {
    try {
      setLoading(true);
      const data = await scanForOrphanedMembers();
      setResults(Array.isArray(data) ? (data as OrphanedMember[]) : []);
      toast({ title: "Orphaned Members", description: "Scan completed successfully." });
    } catch (error) {
      const description = error instanceof Error ? error.message : "Action failed.";
      toast({ title: "Action failed", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(member: OrphanedMember) {
    const key = `${member.churchId}/${member.memberId}`;
    const confirmed = window.confirm(
      `Delete orphaned member ${member.memberName || member.memberId}? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingKey(key);
      await deleteOrphanedMember(member.churchId, member.memberId);
      setResults((prev) =>
        prev.filter((item) => !(item.churchId === member.churchId && item.memberId === member.memberId))
      );
      toast({ title: "Member deleted", description: "Orphaned member has been removed." });
    } catch (error) {
      const description = error instanceof Error ? error.message : "Delete failed.";
      toast({ title: "Delete failed", description, variant: "destructive" });
    } finally {
      setDeletingKey(null);
    }
  }

  const reasonLabel: Record<NonNullable<OrphanedMember["reason"]>, string> = {
    "inactive-church": "Church inactive",
    "missing-user-link": "No user link",
    "dangling-user-link": "Linked user missing",
  };

  return (
    <div className="border p-4 rounded-md space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Orphaned Members</h3>
          <p className="text-sm text-muted-foreground">
            Members with missing user links or in inactive churches.
          </p>
        </div>
        <Button onClick={run} disabled={loading}>{loading ? "Running…" : "Run Scan"}</Button>
      </div>

      {!loading && results.length === 0 && (
        <p className="text-sm text-muted-foreground">No scan results yet.</p>
      )}

      {results.length > 0 && (
        <div className="space-y-2 max-h-72 overflow-auto pr-1">
          {results.map((member) => {
            const key = `${member.churchId}/${member.memberId}`;
            return (
              <div key={key} className="rounded-md border border-border/70 bg-black/10 p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{member.memberName || "Unnamed member"}</p>
                  <p className="text-sm text-muted-foreground truncate">Church: {member.churchName || member.churchId}</p>
                  <p className="text-xs text-muted-foreground mt-1">Member ID: {member.memberId}</p>
                  <p className="text-xs text-muted-foreground">Linked user: {member.linkedUserId || "None"}</p>
                  <p className="text-xs text-muted-foreground">
                    Reason: {member.reason ? reasonLabel[member.reason] : "Unknown"}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(member)}
                  disabled={deletingKey === key}
                >
                  {deletingKey === key ? "Deleting..." : "Delete"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChurchesWithoutAdminsTool() {
  const [results, setResults] = useState<ChurchWithoutAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function run() {
    try {
      setLoading(true);
      const data = await scanForChurchesWithoutAdmins();
      setResults(Array.isArray(data) ? (data as ChurchWithoutAdmin[]) : []);
      toast({ title: "Churches Without Admins", description: "Scan completed successfully." });
    } catch (error) {
      const description = error instanceof Error ? error.message : "Action failed.";
      toast({ title: "Action failed", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border p-4 rounded-md space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Churches Without Admins</h3>
          <p className="text-sm text-muted-foreground">Churches that currently have no Admin users.</p>
        </div>
        <Button onClick={run} disabled={loading}>{loading ? "Running…" : "Run Scan"}</Button>
      </div>

      {!loading && results.length === 0 && (
        <p className="text-sm text-muted-foreground">No scan results yet.</p>
      )}

      {results.length > 0 && (
        <div className="space-y-2 max-h-72 overflow-auto pr-1">
          {results.map((church) => (
            <div key={church.id} className="rounded-md border border-border/70 bg-black/10 p-3">
              <p className="font-medium truncate">{church.name || church.id}</p>
              <p className="text-xs text-muted-foreground mt-1">Church ID: {church.id}</p>
              <p className="text-xs text-muted-foreground">Status: {church.status || "Unknown"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InvalidRolesTool() {
  const [results, setResults] = useState<InvalidRoleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [repairingUid, setRepairingUid] = useState<string | null>(null);
  const { toast } = useToast();

  async function run() {
    try {
      setLoading(true);
      const data = await scanForInvalidRoles();
      setResults(Array.isArray(data) ? (data as InvalidRoleUser[]) : []);
      toast({ title: "Users With Invalid Roles", description: "Scan completed successfully." });
    } catch (error) {
      const description = error instanceof Error ? error.message : "Action failed.";
      toast({ title: "Action failed", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleRepair(user: InvalidRoleUser) {
    try {
      setRepairingUid(user.uid);
      const result = await repairInvalidUserRoles(user.uid);

      setResults((prev) =>
        prev
          .map((item) =>
            item.uid === user.uid
              ? { ...item, roles: (result as { roles?: string[] }).roles ?? [], invalidRoles: [], validRoles: (result as { roles?: string[] }).roles ?? [] }
              : item
          )
          .filter((item) => (item.invalidRoles?.length ?? 0) > 0)
      );

      toast({ title: "Roles repaired", description: "Invalid roles removed for this user." });
    } catch (error) {
      const description = error instanceof Error ? error.message : "Repair failed.";
      toast({ title: "Repair failed", description, variant: "destructive" });
    } finally {
      setRepairingUid(null);
    }
  }

  return (
    <div className="border p-4 rounded-md space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Users With Invalid Roles</h3>
          <p className="text-sm text-muted-foreground">
            Users whose role values include unsupported entries.
          </p>
        </div>
        <Button onClick={run} disabled={loading}>{loading ? "Running…" : "Run Scan"}</Button>
      </div>

      {!loading && results.length === 0 && (
        <p className="text-sm text-muted-foreground">No scan results yet.</p>
      )}

      {results.length > 0 && (
        <div className="space-y-2 max-h-72 overflow-auto pr-1">
          {results.map((user) => {
            const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
            return (
              <div key={user.uid} className="rounded-md border border-border/70 bg-black/10 p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{fullName || "Unnamed user"}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email || "No email"}</p>
                  <p className="text-xs text-muted-foreground mt-1">UID: {user.uid}</p>
                  <p className="text-xs text-muted-foreground">
                    Invalid roles: {(user.invalidRoles ?? []).join(", ") || "None"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Valid roles: {(user.validRoles ?? []).join(", ") || "None"}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleRepair(user)}
                  disabled={repairingUid === user.uid}
                >
                  {repairingUid === user.uid ? "Fixing..." : "Fix Roles"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SectionIntegrityTools() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Integrity Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        <StrayUsersTool />

        <OrphanedMembersTool />

        <ChurchesWithoutAdminsTool />

        <InvalidRolesTool />

        <IntegrityTool
          title="Normalize User UIDs"
          description="One-time cleanup that sets each user document uid to its document ID and removes legacy id fields."
          action={normalizeUserUids}
          actionLabel="Normalize"
        />

      </CardContent>
    </Card>
  );
}
//app/(dashboard)/admin/settings/sections/SectionIntegrityTools.tsx
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { scanForStrayUsers, scanForOrphanedMembers, scanForChurchesWithoutAdmins, scanForInvalidRoles, normalizeUserUids } from "../integrityActions";
import { useToast } from "@/app/hooks/use-toast";

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

export default function SectionIntegrityTools() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Integrity Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        <IntegrityTool
          title="Stray Users"
          description="Users whose churchId does not match any existing church."
          action={scanForStrayUsers}
        />

        <IntegrityTool
          title="Orphaned Members"
          description="Members in church subcollections that are not linked to a user."
          action={scanForOrphanedMembers}
        />

        <IntegrityTool
          title="Churches Without Admins"
          description="Churches that have no users with the Admin role."
          action={scanForChurchesWithoutAdmins}
        />

        <IntegrityTool
          title="Users With Invalid Roles"
          description="Users whose roles include values not recognized by the system."
          action={scanForInvalidRoles}
        />

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
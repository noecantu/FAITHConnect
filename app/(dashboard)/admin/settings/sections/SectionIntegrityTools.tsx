//app/(dashboard)/admin/settings/sections/SectionIntegrityTools.tsx
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { scanForStrayUsers, scanForOrphanedMembers, scanForChurchesWithoutAdmins, scanForInvalidRoles } from "../integrityActions";

interface IntegrityToolProps {
  title: string;
  description: string;
  action: () => Promise<any[]>;
}

function IntegrityTool({ title, description, action }: IntegrityToolProps) {
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    const data = await action();
    setResults(data);
    setLoading(false);
  }

  return (
    <div className="border p-4 rounded-md space-y-2">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button onClick={run} disabled={loading}>
          {loading ? "Scanning…" : "Run Scan"}
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

      </CardContent>
    </Card>
  );
}
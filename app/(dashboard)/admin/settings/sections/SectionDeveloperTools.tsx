//app/(dashboard)/admin/settings/sections/SectionDeveloperTools.tsx
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import type { SystemSettings } from "@/app/lib/types";
import { clearSystemCache, rebuildSearchIndex, triggerBackgroundJobs } from "../devToolsActions";

interface DevToolButtonProps {
  label: string;
  action: () => Promise<any>;
}

function DevToolButton({ label, action }: DevToolButtonProps) {
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    await action();
    setLoading(false);
  }

  return (
    <Button variant="outline" size="sm" onClick={run} disabled={loading}>
      {loading ? "Running…" : label}
    </Button>
  );
}

export default function SectionDeveloperTools({
  settings,
  updateSettings
}: {
  settings: SystemSettings;
  updateSettings: (s: SystemSettings) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Developer & Debug Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="flex items-center gap-2">
          <Checkbox
            checked={settings.debugMode}
            onCheckedChange={(checked) =>
              updateSettings({ ...settings, debugMode: Boolean(checked) })
            }
          />
          <Label>Enable Debug Mode</Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={settings.logAllRequests}
            onCheckedChange={(checked) =>
              updateSettings({ ...settings, logAllRequests: Boolean(checked) })
            }
          />
          <Label>Log All Requests</Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={settings.showDevToolsInUI}
            onCheckedChange={(checked) =>
              updateSettings({ ...settings, showDevToolsInUI: Boolean(checked) })
            }
          />
          <Label>Show Developer Tools in Dashboard UI</Label>
        </div>

        <div className="h-px bg-border my-2" />

        <div className="flex flex-wrap gap-2">
          <DevToolButton label="Clear System Cache" action={clearSystemCache} />
          <DevToolButton label="Rebuild Search Index" action={rebuildSearchIndex} />
          <DevToolButton label="Trigger Background Jobs" action={triggerBackgroundJobs} />
        </div>

      </CardContent>
    </Card>
  );
}
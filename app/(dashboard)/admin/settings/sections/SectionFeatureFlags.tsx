//app/(dashboard)/admin/settings/sections/SectionIdentity.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import type { SystemSettings } from "@/app/lib/types";

export default function SectionFeatureFlags({
  settings,
  setSettings
}: {
  settings: SystemSettings;
  setSettings: (s: SystemSettings) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {Object.entries(settings.featureFlags).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <Checkbox
              checked={Boolean(value)}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  featureFlags: {
                    ...settings.featureFlags,
                    [key]: Boolean(checked)
                  }
                })
              }
            />
            <Label className="capitalize">
              {key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (s) => s.toUpperCase())}
            </Label>
          </div>
        ))}

      </CardContent>
    </Card>
  );
}
//app/(dashboard)/admin/settings/sections/SectionIdentity.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import type { SystemSettings } from "@/app/lib/types";

export default function SectionIdentity({
  settings,
  updateSettings
}: {
  settings: SystemSettings;
  updateSettings: (s: Partial<SystemSettings>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Identity</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        <div className="space-y-1">
          <Label>Platform Name</Label>
          <Input
            value={settings.platformName}
            onChange={(e) =>
              updateSettings({ platformName: e.target.value })
            }
          />
        </div>

        <div className="space-y-1">
          <Label>Support Email</Label>
          <Input
            value={settings.supportEmail}
            onChange={(e) =>
              updateSettings({ supportEmail: e.target.value })
            }
          />
        </div>

        <div className="space-y-1">
          <Label>Default Timezone</Label>
          <Input
            value={settings.defaultTimezone}
            onChange={(e) =>
              updateSettings({ defaultTimezone: e.target.value })
            }
          />
        </div>

        <div className="space-y-1">
          <Label>Default Locale</Label>
          <Input
            value={settings.defaultLocale}
            onChange={(e) =>
              updateSettings({ defaultLocale: e.target.value })
            }
          />
        </div>

      </CardContent>
    </Card>
  );
}

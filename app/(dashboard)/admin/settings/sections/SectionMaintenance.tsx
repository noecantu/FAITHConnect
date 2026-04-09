//app/(dashboard)/admin/settings/sections/SectionIdentity.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import type { SystemSettings } from "@/app/lib/types";

export default function SectionMaintenance({
  settings,
  updateSettings
}: {
  settings: SystemSettings;
  updateSettings: (s: Partial<SystemSettings>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance & Operations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="flex items-center gap-2">
          <Checkbox
            checked={settings.maintenanceMode}
            onCheckedChange={(checked) =>
              updateSettings({ ...settings, maintenanceMode: Boolean(checked) })
            }
          />
          <Label>Enable Maintenance Mode</Label>
        </div>

        <div className="space-y-1">
          <Label>Maintenance Message</Label>
          <Input
            value={settings.maintenanceMessage}
            onChange={(e) =>
              updateSettings({ ...settings, maintenanceMessage: e.target.value })
            }
            placeholder="The system is undergoing maintenance..."
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={settings.allowRegistrations}
            onCheckedChange={(checked) =>
              updateSettings({ ...settings, allowRegistrations: Boolean(checked) })
            }
          />
          <Label>Allow New User Registrations</Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={settings.allowChurchCreation}
            onCheckedChange={(checked) =>
              updateSettings({ ...settings, allowChurchCreation: Boolean(checked) })
            }
          />
          <Label>Allow New Church Creation</Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={settings.disableEmailSending}
            onCheckedChange={(checked) =>
              updateSettings({ ...settings, disableEmailSending: Boolean(checked) })
            }
          />
          <Label>Disable Outbound Email</Label>
        </div>

      </CardContent>
    </Card>
  );
}
//app/(dashboard)/admin/settings/sections/SectionIdentity.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import type { SystemSettings } from "@/app/lib/types";

export default function SectionSecurity({
  settings,
  setSettings
}: {
  settings: SystemSettings;
  setSettings: (s: SystemSettings) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security & Compliance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="flex items-center gap-2">
          <Checkbox
            checked={settings.require2FAForAdmins}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, require2FAForAdmins: Boolean(checked) })
            }
          />
          <Label>Require 2FA for Admin Users</Label>
        </div>

        <div className="space-y-1">
          <Label>Log Retention (days)</Label>
          <Input
            type="number"
            value={settings.logRetentionDays}
            onChange={(e) =>
              setSettings({
                ...settings,
                logRetentionDays: Number(e.target.value || 0)
              })
            }
          />
        </div>

        <div className="space-y-1">
          <Label>Auto-delete Inactive Users After (days)</Label>
          <Input
            type="number"
            value={settings.autoDeleteInactiveUsersAfterDays}
            onChange={(e) =>
              setSettings({
                ...settings,
                autoDeleteInactiveUsersAfterDays: Number(e.target.value || 0)
              })
            }
          />
        </div>

        <div className="space-y-1">
          <Label>Max Failed Login Attempts</Label>
          <Input
            type="number"
            value={settings.maxFailedLoginAttempts}
            onChange={(e) =>
              setSettings({
                ...settings,
                maxFailedLoginAttempts: Number(e.target.value || 0)
              })
            }
          />
        </div>

        <div className="space-y-1">
          <Label>Lockout Duration (minutes)</Label>
          <Input
            type="number"
            value={settings.lockoutDurationMinutes}
            onChange={(e) =>
              setSettings({
                ...settings,
                lockoutDurationMinutes: Number(e.target.value || 0)
              })
            }
          />
        </div>

      </CardContent>
    </Card>
  );
}
//app/(dashboard)/admin/settings/sections/SectionBranding.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import type { SystemSettings } from "@/app/lib/types";

export default function SectionBranding({
  settings,
  updateSettings,
}: {
  settings: SystemSettings;
  updateSettings: (s: Partial<SystemSettings>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="space-y-1">
          <Label>Primary Color (Hex)</Label>
          <Input
            value={settings.branding.primaryColor}
            onChange={(e) =>
              updateSettings({
                branding: {
                  ...settings.branding,
                  primaryColor: e.target.value
                }
              })
            }
          />
        </div>

        <div className="space-y-1">
          <Label>Logo URL</Label>
          <Input
            value={settings.branding.logoUrl}
            onChange={(e) =>
              updateSettings({
                ...settings,
                branding: {
                  ...settings.branding,
                  logoUrl: e.target.value
                }
              })
            }
          />
        </div>

        <div className="space-y-1">
          <Label>Login Background Image URL</Label>
          <Input
            value={settings.branding.loginBackgroundUrl}
            onChange={(e) =>
              updateSettings({
                ...settings,
                branding: {
                  ...settings.branding,
                  loginBackgroundUrl: e.target.value
                }
              })
            }
          />
        </div>

      </CardContent>
    </Card>
  );
}
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import ImageDropzone from "@/app/components/settings/ImageDropzone";
import type { SystemSettings } from "@/app/lib/types";

export default function SectionBranding({
  settings,
  updateSettings,
}: {
  settings: SystemSettings;
  updateSettings: (s: Partial<SystemSettings>) => void;
}) {
  const branding = settings.branding;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Primary Color */}
        <div className="space-y-2">
          <Label>Primary Color (Hex)</Label>
          <Input
            value={branding.primaryColor}
            onChange={(e) =>
              updateSettings({
                branding: {
                  ...branding,
                  primaryColor: e.target.value,
                },
              })
            }
          />
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>Logo</Label>

          {branding.logoUrl && (
            <img
              src={branding.logoUrl}
              alt="Logo"
              className="h-16 object-contain rounded border"
            />
          )}

          <ImageDropzone
            label="Upload Logo"
            path="branding/logo.png"
            onUploaded={(url) =>
              updateSettings({
                branding: {
                  ...branding,
                  logoUrl: url,
                },
              })
            }
          />
        </div>

        {/* Background Upload */}
        <div className="space-y-2">
          <Label>Login Background Image</Label>

          {branding.loginBackgroundUrl && (
            <img
              src={branding.loginBackgroundUrl}
              alt="Background"
              className="h-32 w-full object-cover rounded border"
            />
          )}

          <ImageDropzone
            label="Upload Background Image"
            path="branding/login-background.jpg"
            onUploaded={(url) =>
              updateSettings({
                branding: {
                  ...branding,
                  loginBackgroundUrl: url,
                },
              })
            }
          />
        </div>

      </CardContent>
    </Card>
  );
}

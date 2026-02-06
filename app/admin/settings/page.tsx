"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

import { PageHeader } from "@/app/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const ref = doc(db, "system", "settings");
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setSettings(snap.data());
      }
    }

    load();
  }, []);

  async function handleSave() {
    if (!settings) return;

    setSaving(true);

    try {
      const ref = doc(db, "system", "settings");
      await updateDoc(ref, settings);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="p-6">
        <PageHeader title="System Settings" subtitle="Loading settings…" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="System Settings"
        subtitle="Global configuration for the FAITH Connect platform"
      />

      {/* GENERAL SETTINGS */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-1">
            <Label>Platform Name</Label>
            <Input
              value={settings.platformName}
              onChange={(e) =>
                setSettings({ ...settings, platformName: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <Label>Support Email</Label>
            <Input
              value={settings.supportEmail}
              onChange={(e) =>
                setSettings({ ...settings, supportEmail: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <Label>Default Timezone</Label>
            <Input
              value={settings.defaultTimezone}
              onChange={(e) =>
                setSettings({ ...settings, defaultTimezone: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <Label>Default Locale</Label>
            <Input
              value={settings.defaultLocale}
              onChange={(e) =>
                setSettings({ ...settings, defaultLocale: e.target.value })
              }
            />
          </div>

        </CardContent>
      </Card>

      {/* FEATURE FLAGS */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">

          {Object.entries(settings.featureFlags).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                checked={Boolean(value)}
                onCheckedChange={(checked) =>
                    setSettings({
                    ...settings,
                    featureFlags: {
                        ...settings.featureFlags,
                        [key]: Boolean(checked),
                    },
                    })
                }
            />
              <span className="capitalize">{key}</span>
            </div>
          ))}

        </CardContent>
      </Card>

      {/* SAVE BUTTON */}
      <div className="flex justify-end">
        <Button disabled={saving} onClick={handleSave}>
          {saving ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

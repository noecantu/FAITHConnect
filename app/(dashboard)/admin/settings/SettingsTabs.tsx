//app/(dashboard)/admin/settings/SettingsTabs.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { saveSystemSettings } from "./actions";
import type { SystemSettings } from "@/app/lib/types";

import SectionIdentity from "./sections/SectionIdentity";
import SectionBranding from "./sections/SectionBranding";
import SectionMaintenance from "./sections/SectionMaintenance";
import SectionFeatureFlags from "./sections/SectionFeatureFlags";
import SectionSecurity from "./sections/SectionSecurity";
import SectionIntegrityTools from "./sections/SectionIntegrityTools";
import SectionMonitoring from "./sections/SectionMonitoring";
import SectionDeveloperTools from "./sections/SectionDeveloperTools";

export default function SettingsTabs({ initialSettings }: { initialSettings: SystemSettings }) {
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await saveSystemSettings({ ...settings, updatedAt: new Date() });
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="identity" className="w-full">

        <TabsList className="grid grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrity">Integrity</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="developer">Developer</TabsTrigger>
        </TabsList>

        <TabsContent value="identity">
          <SectionIdentity settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="branding">
          <SectionBranding settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="maintenance">
          <SectionMaintenance settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="features">
          <SectionFeatureFlags settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="security">
          <SectionSecurity settings={settings} setSettings={setSettings} />
        </TabsContent>

        <TabsContent value="integrity">
          <SectionIntegrityTools />
        </TabsContent>

        <TabsContent value="monitoring">
          <SectionMonitoring />
        </TabsContent>

        <TabsContent value="developer">
          <SectionDeveloperTools settings={settings} setSettings={setSettings} />
        </TabsContent>

      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save All Settings"}
        </Button>
      </div>
    </div>
  );
}

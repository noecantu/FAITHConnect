//app/(dashboard)/admin/settings/page.tsx
'use client';

import { useState } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { Fab } from '@/app/components/ui/fab';

import type { SystemSettings } from '@/app/lib/types';
import { saveSystemSettings } from './actions';

import SectionIdentity from './sections/SectionIdentity';
import SectionMaintenance from './sections/SectionMaintenance';
import SectionFeatureFlags from './sections/SectionFeatureFlags';
import SectionSecurity from './sections/SectionSecurity';
import SectionIntegrityTools from './sections/SectionIntegrityTools';
import SectionMonitoring from './sections/SectionMonitoring';
import SectionDeveloperTools from './sections/SectionDeveloperTools';

export default function RootAdminSettingsPage({ initialSettings }: { initialSettings: SystemSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateSettings(newSettings: Partial<SystemSettings>) {
    setSettings(prev => ({ ...prev, ...newSettings }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    await saveSystemSettings({ ...settings, updatedAt: new Date() });
    setSaving(false);
    setDirty(false);
  }

  if (!initialSettings) {
    return (
      <>
        <PageHeader title="System Settings" subtitle="Loading…" />
        <div className="p-6 text-neutral-500">Loading settings…</div>
      </>
    );
  }
  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionIdentity settings={settings} updateSettings={updateSettings} />
        <SectionSecurity settings={settings} updateSettings={updateSettings} />
        <SectionDeveloperTools settings={settings} updateSettings={updateSettings} />
        <SectionFeatureFlags settings={settings} updateSettings={updateSettings} />
        <SectionMaintenance settings={settings} updateSettings={updateSettings} />
        <SectionIntegrityTools />
        <SectionMonitoring />
      </div>

      {dirty && (
        <Fab type="save" onClick={handleSave} disabled={saving} />
      )}
    </>
  );
}

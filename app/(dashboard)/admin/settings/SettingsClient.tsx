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
      <div className="columns-1 md:columns-2 gap-6">
        <div className="mb-6 break-inside-avoid">
          <SectionIdentity settings={settings} updateSettings={updateSettings} />
        </div>
        <div className="mb-6 break-inside-avoid">
          <SectionSecurity settings={settings} updateSettings={updateSettings} />
        </div>
        <div className="mb-6 break-inside-avoid">
          <SectionDeveloperTools settings={settings} updateSettings={updateSettings} />
        </div>
        <div className="mb-6 break-inside-avoid">
          <SectionFeatureFlags settings={settings} updateSettings={updateSettings} />
        </div>
        <div className="mb-6 break-inside-avoid">
          <SectionMaintenance settings={settings} updateSettings={updateSettings} />
        </div>
        <div className="mb-6 break-inside-avoid">
          <SectionIntegrityTools />
        </div>
        <div className="mb-6 break-inside-avoid">
          <SectionMonitoring />
        </div>
      </div>

      {dirty && (
        <Fab type="save" onClick={handleSave} disabled={saving} />
      )}
    </>
  );
}

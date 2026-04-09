// app/(dashboard)/admin/settings/page.tsx
import { DashboardPage } from '@/app/(dashboard)/layout/DashboardPage';
import { PageHeader } from '@/app/components/page-header';
import { loadSystemSettings } from './actions';
import SettingsClient from './SettingsClient';

export default async function RootAdminSettingsPage() {
  const initialSettings = await loadSystemSettings();

  return (
    <DashboardPage>
      <PageHeader
        title="System Settings"
        subtitle="Manage global configuration for the FAITH Connect platform."
        className="mb-4"
      />

      <SettingsClient initialSettings={initialSettings} />
    </DashboardPage>
  );
}

//app/(dashboard)/admin/settings/page.tsx
import { loadSystemSettings } from "./actions";
import SettingsTabs from "./SettingsTabs";
import { DashboardPage } from "@/app/(dashboard)/layout/DashboardPage";

export default async function AdminSystemSettingsPage() {
  const settings = await loadSystemSettings();

  return (
    <DashboardPage>
      <SettingsTabs initialSettings={settings} />
    </DashboardPage>
  );
}
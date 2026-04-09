import { loadSystemSettings } from "./actions";
import SettingsTabs from "./SettingsTabs";

export default async function AdminSystemSettingsPage() {
  const settings = await loadSystemSettings();
  return <SettingsTabs initialSettings={settings} />;
}

"use client";

import { useState } from "react";
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
import { Fab } from "@/app/components/ui/fab";

const NAV = [
  { key: "identity", label: "Identity" },
  { key: "branding", label: "Branding" },
  { key: "maintenance", label: "Maintenance" },
  { key: "features", label: "Features" },
  { key: "security", label: "Security" },
  { key: "integrity", label: "Integrity" },
  { key: "monitoring", label: "Monitoring" },
  { key: "developer", label: "Developer" },
];

export default function SettingsTabs({ initialSettings }: { initialSettings: SystemSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState("identity");

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

  return (
    <div className="w-full bg-neutral-950 text-white">

      {/* PAGE HEADER */}
      <header className="border-b border-neutral-800 px-10 py-6">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-neutral-400 mt-1">
          Manage global configuration for the FAITH Connect platform.
        </p>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex w-full">

        {/* SIDEBAR */}
        <aside className="w-64 bg-neutral-900 border-r border-neutral-800 p-3 space-y-1">
          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className={`
                w-full text-left px-4 py-2 rounded-md transition
                ${active === item.key
                  ? "bg-neutral-800 text-white shadow-[inset_4px_0_0_0_#3b82f6]"
                  : "text-neutral-300 hover:bg-neutral-800 hover:text-white"}
              `}
            >
              {item.label}
            </button>
          ))}
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 p-10">
          <div className="max-w-4xl space-y-10">

            {/* CARD WRAPPER */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 space-y-8">

              {active === "identity" && (
                <SectionIdentity settings={settings} updateSettings={updateSettings} />
              )}

              {active === "branding" && (
                <SectionBranding settings={settings} updateSettings={updateSettings} />
              )}

              {active === "maintenance" && (
                <SectionMaintenance settings={settings} updateSettings={updateSettings} />
              )}

              {active === "features" && (
                <SectionFeatureFlags settings={settings} updateSettings={updateSettings} />
              )}

              {active === "security" && (
                <SectionSecurity settings={settings} updateSettings={updateSettings} />
              )}

              {active === "integrity" && <SectionIntegrityTools />}

              {active === "monitoring" && <SectionMonitoring />}

              {active === "developer" && (
                <SectionDeveloperTools settings={settings} updateSettings={updateSettings} />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* FLOATING ACTION BUTTON */}
      {dirty && (
        <Fab
          type="save"
          onClick={handleSave}
          disabled={saving}
        />
      )}

    </div>
  );
}

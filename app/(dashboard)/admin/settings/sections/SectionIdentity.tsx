"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/hooks/use-toast";

import TimezoneSelect from "@/app/components/settings/TimezoneSelect";
import LocaleSelect from "@/app/components/settings/LocaleSelect";

import { getSupabaseClient } from "@/app/lib/supabase/client";
;

import type { SystemSettings } from "@/app/lib/types";

type IdentityFields = {
  platformName: string;
  supportEmail: string;
  defaultTimezone: string;
  defaultLocale: string;
};

export default function SectionIdentity({
  const supabase = getSupabaseClient();
  settings,
}: {
  settings: SystemSettings;
  updateSettings: (s: Partial<SystemSettings>) => void;
}) {
  const { toast } = useToast();

  // Local editable state
  const [platformName, setPlatformName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [defaultTimezone, setDefaultTimezone] = useState("");
  const [defaultLocale, setDefaultLocale] = useState("");

  // Originals for change detection
  const [original, setOriginal] = useState<IdentityFields | null>(null);

  const [saving, setSaving] = useState(false);

  // Load settings into local state
  useEffect(() => {
    if (!settings) return;

    const identity: IdentityFields = {
      platformName: settings.platformName ?? "",
      supportEmail: settings.supportEmail ?? "",
      defaultTimezone: settings.defaultTimezone ?? "",
      defaultLocale: settings.defaultLocale ?? "",
    };

    setPlatformName(identity.platformName);
    setSupportEmail(identity.supportEmail);
    setDefaultTimezone(identity.defaultTimezone);
    setDefaultLocale(identity.defaultLocale);

    setOriginal(identity);
  }, [settings]);

  // Detect unsaved changes
  const hasChanges =
    original &&
    (
      platformName !== original.platformName ||
      supportEmail !== original.supportEmail ||
      defaultTimezone !== original.defaultTimezone ||
      defaultLocale !== original.defaultLocale
    );

  // Save handler
  const handleSave = async () => {
    if (!hasChanges || saving) return;

    setSaving(true);

    try {
      const ref = doc(db, "system", "settings");

      await updateDoc(ref, {
        platformName,
        supportEmail,
        defaultTimezone,
        defaultLocale,
        updated_at: new Date(),
      });

      // Update originals
      setOriginal({
        platformName,
        supportEmail,
        defaultTimezone,
        defaultLocale,
      });

      toast({
        title: "Saved",
        description: "Platform identity updated.",
      });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Identity</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        <div className="space-y-2">
          <Label>Platform Name</Label>
          <Input
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Support Email</Label>
          <Input
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
          />
        </div>

        <TimezoneSelect
          value={defaultTimezone}
          onChange={(value) => setDefaultTimezone(value)}
        />

        <LocaleSelect
          value={defaultLocale}
          onChange={(value) => setDefaultLocale(value)}
        />

        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="w-full sm:w-auto"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>

      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import type { SystemSettings } from "@/app/lib/types";
import { saveSystemSettings } from "./actions";

import { PageHeader } from "@/app/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";
import { DashboardPage } from "../../layout/DashboardPage";
import { scanForChurchesWithoutAdmins, scanForInvalidRoles, scanForOrphanedMembers, scanForStrayUsers } from "./integrityActions";
import { getDatabaseStats, getEmailProviderHealth, getStorageUsage, getStripeSyncStatus } from "./monitoringActions";
import { clearSystemCache, rebuildSearchIndex, triggerBackgroundJobs } from "./devToolsActions";

interface SettingsFormProps {
  initialSettings: SystemSettings;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState<SystemSettings>({
    ...initialSettings,
    branding: {
        primaryColor: initialSettings.branding?.primaryColor ?? "",
        logoUrl: initialSettings.branding?.logoUrl ?? "",
        loginBackgroundUrl: initialSettings.branding?.loginBackgroundUrl ?? ""
    }
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);

    await saveSystemSettings({
      ...settings,
      updatedAt: new Date()
    });

    setSaving(false);
  }

  interface IntegrityToolProps {
    title: string;
    description: string;
    action: () => Promise<any[]>;
  }


  function IntegrityTool({ title, description, action }: IntegrityToolProps) {
    const [results, setResults] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(false);

    async function run() {
        setLoading(true);
        const data = await action();
        setResults(data);
        setLoading(false);
    }

    return (
        <div className="border p-4 rounded-md space-y-2">
        <div className="flex justify-between items-center">
            <div>
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            <Button onClick={run} disabled={loading}>
            {loading ? "Scanning…" : "Run Scan"}
            </Button>
        </div>

        {results && (
            <pre className="bg-black/20 p-3 rounded text-xs overflow-auto max-h-64">
            {JSON.stringify(results, null, 2)}
            </pre>
        )}
        </div>
    );
    }

    interface MonitoringCardProps {
        title: string;
        action: () => Promise<any>;
        formatter: (data: any) => string;
    }

    function MonitoringCard({ title, action, formatter }: MonitoringCardProps) {
        const [loading, setLoading] = useState(false);
        const [result, setResult] = useState<any>(null);

        async function run() {
            setLoading(true);
            const data = await action();
            setResult(data);
            setLoading(false);
        }

        return (
            <div className="border p-4 rounded-md space-y-2">
            <div className="flex justify-between items-center">
                <h3 className="font-medium">{title}</h3>
                <Button onClick={run} disabled={loading}>
                {loading ? "Loading…" : "Refresh"}
                </Button>
            </div>

            {result && (
                <pre className="bg-black/20 p-3 rounded text-xs overflow-auto max-h-64">
                {formatter(result)}
                </pre>
            )}
            </div>
        );
    }

    interface DevToolButtonProps {
        label: string;
        action: () => Promise<any>;
    }

    function DevToolButton({ label, action }: DevToolButtonProps) {
        const [loading, setLoading] = useState(false);

        async function run() {
            setLoading(true);
            await action();
            setLoading(false);
        }

        return (
            <Button variant="outline" size="sm" onClick={run} disabled={loading}>
            {loading ? "Running…" : label}
            </Button>
        );
    }

  return (
    <DashboardPage>
        <PageHeader
            title="System Settings"
            subtitle="Global configuration for the FAITH Connect platform"
        />

        {/* PLATFORM IDENTITY */}
        <Card>
            <CardHeader>
                <CardTitle>Platform Identity</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">

                {/* Platform Name */}
                <div className="space-y-1">
                <Label>Platform Name</Label>
                <Input
                    value={settings.platformName}
                    onChange={(e) =>
                    setSettings({ ...settings, platformName: e.target.value })
                    }
                />
                </div>

                {/* Support Email */}
                <div className="space-y-1">
                <Label>Support Email</Label>
                <Input
                    value={settings.supportEmail}
                    onChange={(e) =>
                    setSettings({ ...settings, supportEmail: e.target.value })
                    }
                />
                </div>

                {/* Default Timezone */}
                <div className="space-y-1">
                <Label>Default Timezone</Label>
                <Input
                    value={settings.defaultTimezone}
                    onChange={(e) =>
                    setSettings({ ...settings, defaultTimezone: e.target.value })
                    }
                />
                </div>

                {/* Default Locale */}
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

            <CardContent className="space-y-4">

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
                        <Label className="capitalize">
                        {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (s) => s.toUpperCase())}
                        </Label>
                    </div>
                ))}

            </CardContent>
        </Card>

        {/* BRANDING */}
        <Card>
            <CardHeader>
                <CardTitle>Branding</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">

                {/* Primary Color */}
                <div className="space-y-1">
                <Label>Primary Color (Hex)</Label>
                <Input
                    value={settings.branding.primaryColor}
                    onChange={(e) =>
                    setSettings({
                        ...settings,
                        branding: {
                        ...settings.branding,
                        primaryColor: e.target.value
                        }
                    })
                    }
                />
                </div>

                {/* MAINTENANCE & OPERATIONS */}
                <Card>
                <CardHeader>
                    <CardTitle>Maintenance & Operations</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">

                    {/* Maintenance Mode */}
                    <div className="flex items-center gap-2">
                    <Checkbox
                        checked={settings.maintenanceMode}
                        onCheckedChange={(checked) =>
                        setSettings({ ...settings, maintenanceMode: Boolean(checked) })
                        }
                    />
                    <Label>Enable Maintenance Mode</Label>
                    </div>

                    {/* Maintenance Message */}
                    <div className="space-y-1">
                    <Label>Maintenance Message</Label>
                    <Input
                        value={settings.maintenanceMessage}
                        onChange={(e) =>
                        setSettings({ ...settings, maintenanceMessage: e.target.value })
                        }
                        placeholder="e.g., The system is undergoing maintenance..."
                    />
                    </div>

                    {/* Allow Registrations */}
                    <div className="flex items-center gap-2">
                    <Checkbox
                        checked={settings.allowRegistrations}
                        onCheckedChange={(checked) =>
                        setSettings({ ...settings, allowRegistrations: Boolean(checked) })
                        }
                    />
                    <Label>Allow New User Registrations</Label>
                    </div>

                    {/* Allow Church Creation */}
                    <div className="flex items-center gap-2">
                    <Checkbox
                        checked={settings.allowChurchCreation}
                        onCheckedChange={(checked) =>
                        setSettings({ ...settings, allowChurchCreation: Boolean(checked) })
                        }
                    />
                    <Label>Allow New Church Creation</Label>
                    </div>

                    {/* Disable Email Sending */}
                    <div className="flex items-center gap-2">
                    <Checkbox
                        checked={settings.disableEmailSending}
                        onCheckedChange={(checked) =>
                        setSettings({ ...settings, disableEmailSending: Boolean(checked) })
                        }
                    />
                    <Label>Disable Outbound Email</Label>
                    </div>

                </CardContent>
                </Card>

                {/* Logo URL */}
                <div className="space-y-1">
                <Label>Logo URL</Label>
                <Input
                    value={settings.branding.logoUrl}
                    onChange={(e) =>
                    setSettings({
                        ...settings,
                        branding: {
                        ...settings.branding,
                        logoUrl: e.target.value
                        }
                    })
                    }
                />
                </div>

                {/* Login Background */}
                <div className="space-y-1">
                <Label>Login Background Image URL</Label>
                <Input
                    value={settings.branding.loginBackgroundUrl}
                    onChange={(e) =>
                    setSettings({
                        ...settings,
                        branding: {
                        ...settings.branding,
                        loginBackgroundUrl: e.target.value
                        }
                    })
                    }
                />
                </div>

                {/* SECURITY & COMPLIANCE */}
                <Card>
                    <CardHeader>
                        <CardTitle>Security & Compliance</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">

                        {/* Require 2FA for Admins */}
                        <div className="flex items-center gap-2">
                        <Checkbox
                            checked={settings.require2FAForAdmins}
                            onCheckedChange={(checked) =>
                            setSettings({ ...settings, require2FAForAdmins: Boolean(checked) })
                            }
                        />
                        <Label>Require 2FA for Admin Users</Label>
                        </div>

                        {/* Log Retention */}
                        <div className="space-y-1">
                        <Label>Log Retention (days)</Label>
                        <Input
                            type="number"
                            value={settings.logRetentionDays}
                            onChange={(e) =>
                            setSettings({
                                ...settings,
                                logRetentionDays: Number(e.target.value || 0),
                            })
                            }
                        />
                        </div>

                        {/* Auto-delete inactive users */}
                        <div className="space-y-1">
                        <Label>Auto-delete Inactive Users After (days)</Label>
                        <Input
                            type="number"
                            value={settings.autoDeleteInactiveUsersAfterDays}
                            onChange={(e) =>
                            setSettings({
                                ...settings,
                                autoDeleteInactiveUsersAfterDays: Number(e.target.value || 0),
                            })
                            }
                        />
                        </div>

                        {/* Lockout policy */}
                        <div className="space-y-1">
                        <Label>Max Failed Login Attempts</Label>
                        <Input
                            type="number"
                            value={settings.maxFailedLoginAttempts}
                            onChange={(e) =>
                            setSettings({
                                ...settings,
                                maxFailedLoginAttempts: Number(e.target.value || 0),
                            })
                            }
                        />
                        </div>

                        <div className="space-y-1">
                        <Label>Lockout Duration (minutes)</Label>
                        <Input
                            type="number"
                            value={settings.lockoutDurationMinutes}
                            onChange={(e) =>
                            setSettings({
                                ...settings,
                                lockoutDurationMinutes: Number(e.target.value || 0),
                            })
                            }
                        />
                        </div>

                    </CardContent>
                </Card>

            </CardContent>
        </Card>

        {/* DATA INTEGRITY TOOLS */}
        <Card>
        <CardHeader>
            <CardTitle>Data Integrity Tools</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

            <IntegrityTool
            title="Stray Users"
            description="Users whose churchId does not match any existing church."
            action={scanForStrayUsers}
            />

            <IntegrityTool
            title="Orphaned Members"
            description="Members in church subcollections that are not linked to a user."
            action={scanForOrphanedMembers}
            />

            <IntegrityTool
            title="Churches Without Admins"
            description="Churches that have no users with the Admin role."
            action={scanForChurchesWithoutAdmins}
            />

            <IntegrityTool
            title="Users With Invalid Roles"
            description="Users whose roles include values not recognized by the system."
            action={scanForInvalidRoles}
            />

        </CardContent>
        </Card>

        {/* SYSTEM LOGS & MONITORING */}
        <Card>
            <CardHeader>
                <CardTitle>System Logs & Monitoring</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">

                <MonitoringCard
                title="Storage Usage"
                action={getStorageUsage}
                formatter={(data) => `${(data.totalBytes / 1024 / 1024).toFixed(2)} MB`}
                />

                <MonitoringCard
                title="Database Document Counts"
                action={getDatabaseStats}
                formatter={(data) => JSON.stringify(data, null, 2)}
                />

                <MonitoringCard
                title="Email Provider Health"
                action={getEmailProviderHealth}
                formatter={(data) => `${data.provider}: ${data.status}`}
                />

                <MonitoringCard
                title="Stripe Sync Status"
                action={getStripeSyncStatus}
                formatter={(data) => `Last Sync: ${data.lastSync}`}
                />

            </CardContent>
        </Card>

        {/* EMAIL & NOTIFICATIONS */}
        <Card>
            <CardHeader>
                <CardTitle>Email & Notifications</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">

                {/* Provider */}
                <div className="space-y-1">
                <Label>Email Provider</Label>
                <select
                    className="border rounded px-2 py-1 bg-background"
                    value={settings.emailProvider}
                    onChange={(e) =>
                    setSettings({
                        ...settings,
                        emailProvider: e.target.value as SystemSettings["emailProvider"],
                    })
                    }
                >
                    <option value="sendgrid">SendGrid</option>
                    <option value="mailgun">Mailgun</option>
                    <option value="ses">AWS SES</option>
                </select>
                </div>

                {/* From address */}
                <div className="space-y-1">
                <Label>From Address</Label>
                <Input
                    value={settings.emailFromAddress}
                    onChange={(e) =>
                    setSettings({ ...settings, emailFromAddress: e.target.value })
                    }
                />
                </div>

                {/* Reply-to address */}
                <div className="space-y-1">
                <Label>Reply-To Address</Label>
                <Input
                    value={settings.emailReplyToAddress}
                    onChange={(e) =>
                    setSettings({ ...settings, emailReplyToAddress: e.target.value })
                    }
                />
                </div>

                {/* Welcome template */}
                <div className="space-y-1">
                <Label>Welcome Email Subject</Label>
                <Input
                    value={settings.emailTemplates.welcomeSubject}
                    onChange={(e) =>
                    setSettings({
                        ...settings,
                        emailTemplates: {
                        ...settings.emailTemplates,
                        welcomeSubject: e.target.value,
                        },
                    })
                    }
                />
                </div>

                <div className="space-y-1">
                <Label>Welcome Email Body</Label>
                <textarea
                    className="w-full border rounded px-2 py-1 bg-background min-h-[100px]"
                    value={settings.emailTemplates.welcomeBody}
                    onChange={(e) =>
                    setSettings({
                        ...settings,
                        emailTemplates: {
                        ...settings.emailTemplates,
                        welcomeBody: e.target.value,
                        },
                    })
                    }
                />
                <p className="text-xs text-muted-foreground">
                    Supports placeholders: {"{{name}}"}, {"{{churchName}}"}
                </p>
                </div>

                {/* Password reset template */}
                <div className="space-y-1">
                <Label>Password Reset Subject</Label>
                <Input
                    value={settings.emailTemplates.passwordResetSubject}
                    onChange={(e) =>
                    setSettings({
                        ...settings,
                        emailTemplates: {
                        ...settings.emailTemplates,
                        passwordResetSubject: e.target.value,
                        },
                    })
                    }
                />
                </div>

                <div className="space-y-1">
                <Label>Password Reset Body</Label>
                <textarea
                    className="w-full border rounded px-2 py-1 bg-background min-h-[100px]"
                    value={settings.emailTemplates.passwordResetBody}
                    onChange={(e) =>
                    setSettings({
                        ...settings,
                        emailTemplates: {
                        ...settings.emailTemplates,
                        passwordResetBody: e.target.value,
                        },
                    })
                    }
                />
                <p className="text-xs text-muted-foreground">
                    Supports placeholders: {"{{name}}"}, {"{{resetLink}}"}
                </p>
                </div>

            </CardContent>
        </Card>

        {/* DEVELOPER & DEBUG TOOLS */}
        <Card>
            <CardHeader>
                <CardTitle>Developer & Debug Tools</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">

                {/* Debug mode */}
                <div className="flex items-center gap-2">
                <Checkbox
                    checked={settings.debugMode}
                    onCheckedChange={(checked) =>
                    setSettings({ ...settings, debugMode: Boolean(checked) })
                    }
                />
                <Label>Enable Debug Mode</Label>
                </div>

                {/* Log all requests */}
                <div className="flex items-center gap-2">
                <Checkbox
                    checked={settings.logAllRequests}
                    onCheckedChange={(checked) =>
                    setSettings({ ...settings, logAllRequests: Boolean(checked) })
                    }
                />
                <Label>Log All Requests</Label>
                </div>

                {/* Show dev tools in UI */}
                <div className="flex items-center gap-2">
                <Checkbox
                    checked={settings.showDevToolsInUI}
                    onCheckedChange={(checked) =>
                    setSettings({ ...settings, showDevToolsInUI: Boolean(checked) })
                    }
                />
                <Label>Show Developer Tools in Dashboard UI</Label>
                </div>

                <div className="h-px bg-border my-2" />

                {/* Power buttons */}
                <div className="flex flex-wrap gap-2">
                <DevToolButton label="Clear System Cache" action={clearSystemCache} />
                <DevToolButton label="Rebuild Search Index" action={rebuildSearchIndex} />
                <DevToolButton label="Trigger Background Jobs" action={triggerBackgroundJobs} />
                </div>

            </CardContent>
        </Card>

      {/* SAVE BUTTON */}
      <div className="flex justify-end pt-4">
        <Button disabled={saving} onClick={handleSave}>
          {saving ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </DashboardPage>
  );
}

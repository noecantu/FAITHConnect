//app/(dashboard)/admin/settings/actions.ts
"use server";

import { adminDb } from "@/app/lib/supabase/admin";
import type { SystemSettings } from "@/app/lib/types";

const DEFAULT_SETTINGS: SystemSettings = {
  platformName: "FAITH Connect",
  emailProvider: "sendgrid",
  emailFromAddress: "no-reply@faithconnect.app",
  emailReplyToAddress: "support@faithconnect.app",
  emailTemplates: {
    welcomeSubject: "Welcome to FAITH Connect",
    welcomeBody: "Hi {{name}}, welcome to FAITH Connect...",
    passwordResetSubject: "Reset your FAITH Connect password",
    passwordResetBody: "Hi {{name}}, click the link below to reset your password..."
  },
  supportEmail: "support@example.com",
  defaultTimezone: "America/Chicago",
  defaultLocale: "en-US",
  maintenanceMode: false,
  maintenanceMessage: "",
  allowRegistrations: true,
  allowChurchCreation: true,
  disableEmailSending: false,
  featureFlags: {
    attendanceV2: false,
    musicPlannerV2: false,
    givingAnalytics: false,
    checkInKioskMode: false,
    multiCampusSupport: false,
    aiServicePlanning: false
  },
  logRetentionDays: 90,
  autoDeleteInactiveUsersAfterDays: 365,
  require2FAForAdmins: false,
  maxFailedLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  debugMode: false,
  logAllRequests: false,
  showDevToolsInUI: false,
  lastIntegrityScan: {
    strayUsers: "",
    orphanedMembers: "",
    churchesWithoutAdmins: "",
    invalidRoles: ""
  },
  updatedAt: null
};

export async function loadSystemSettings(): Promise<SystemSettings> {
  const { data } = await adminDb.from("system_settings").select("*").eq("id", "global").single();
  const settings = data?.settings || {};

  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    emailTemplates: {
      ...DEFAULT_SETTINGS.emailTemplates,
      ...(settings.emailTemplates || {})
    }
  };
}

export async function saveSystemSettings(settings: SystemSettings) {
  await adminDb.from("system_settings").upsert({
    id: "global",
    settings: { ...settings, updatedAt: new Date().toISOString() },
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
}

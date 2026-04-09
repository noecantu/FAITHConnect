"use server";

import { adminDb } from "@/app/lib/firebase/admin";
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
  branding: {
    primaryColor: "#1E40AF",
    logoUrl: "",
    loginBackgroundUrl: ""
  },
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
  updatedAt: null
};

export async function loadSystemSettings(): Promise<SystemSettings> {
  const snap = await adminDb.doc("system/settings").get();
  const data = snap.data() || {};

  // Merge defaults with stored values
  return {
    ...DEFAULT_SETTINGS,
    ...data,
    branding: {
      ...DEFAULT_SETTINGS.branding,
      ...(data.branding || {})
    }
  };
}

export async function saveSystemSettings(settings: SystemSettings) {
  await adminDb.doc("system/settings").set(
    {
      ...settings,
      updatedAt: new Date()
    },
    { merge: true }
  );
}

//app/lib/types.ts
import { Timestamp } from 'firebase/firestore';
import type { Role } from '@/app/lib/auth/roles';

export type Address = {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
};

export interface AttendanceRecord {
  id: string;
  date: string;
  memberId?: string;
  memberName?: string;
  visitorId?: string;
  visitorName?: string;
  attended: boolean;
}

export interface AttendanceSummaryItem {
  dateString: string;
  membersPresent: number;
  membersAbsent: number;
  visitorCount: number;
  percentage: number;
}

export interface Church {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  logoUrl?: string | null;
  description?: string | null;
  status?: string | null;
  createdAt?: Date | { seconds: number } | null;
  updatedAt?: Date | { seconds: number } | null;
  enabledAt?: Date | { seconds: number } | null;
  disabledAt?: Date | { seconds: number } | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  leaderName?: string | null;
  leaderTitle?: string | null;
}

export type Contribution = {
  id: string;
  memberId?: string;
  memberName: string;
  amount: number;
  category: 'Tithes' | 'Offering' | 'Donation' | 'Other';
  contributionType: 'Digital Transfer' | 'Cash' | 'Check' | 'Other';
  date: string;
  notes?: string;
};

export type ContributionRecord = {
  memberId: string;
  memberName: string;
  amount: number;
  category: 'Tithes' | 'Offering' | 'Donation' | 'Other';
  contributionType: 'Digital Transfer' | 'Cash' | 'Check' | 'Other';
  date: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Event = {
  id: string;
  title: string;
  dateString: string;
  date: Date;
  description?: string;
  notes?: string;
  visibility: "public" | "private";
  groups: string[];
};

export type Family = {
  id: string;
  name: string;
};

export interface HealthMetrics {
  firestore: {
    users: number;
    churches: number;
    logs: number;
  };
  auth: {
    totalUsers: number;
    providers: Record<string, number>;
  };
  logTypeCounts: { type: string; count: number }[];
  generatedAt: string;
}

export interface LogEntry {
  id: string;
  type: string;
  message: string;
  actorUid?: string | null;
  actorName?: string | null;
  targetId?: string | null;
  targetType?: string | null;
  timestamp?: Date | { seconds: number } | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export type Member = {
  id: string;
  userId?: string | null;
  checkInCode: string;
  qrCode?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber: string;
  profilePhotoUrl?: string;
  status: 'Active' | 'Prospect' | 'Archived';
  address?: Address;
  birthday?: string | null;
  baptismDate?: string | null;
  anniversary?: string | null;
  familyId?: string;
  notes?: string;
  relationships: Relationship[];
};

export type MemberFirestore = Omit<Member, "birthday" | "baptismDate" | "anniversary"> & {
  birthday?: Timestamp;
  baptismDate?: Timestamp;
  anniversary?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Mode = 'list' | 'create' | 'edit' | 'confirm-delete';

export type Relationship = {
  id?: string;
  memberIds: [string, string];
  type: string;
  anniversary?: string;
};

export interface ServicePlan extends ServicePlanFirestore {
  id: string;
  date: Date;
  dateTime: Date;
  visibility: "public" | "private";
}

export type ServicePlanFirestore = {
  title: string;
  dateString: string;
  timeString: string;
  notes: string;
  isPublic: boolean;
  groups: string[];
  sections: ServicePlanSection[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
};

export interface ServicePlanSection {
  id: string;
  title: string;
  personId: string | null;
  songIds: string[];
  notes: string;
  color?: string;
}

export interface SetList {
  id: string;
  churchId: string;
  title: string;
  dateString: string;
  timeString: string;
  date: Date;
  dateTime: Date;
  sections: SetListSection[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  serviceType?: string | null;
  serviceNotes?: {
    theme?: string | null;
    scripture?: string | null;
    notes?: string | null;
  } | null;
}

export interface SetListFirestore {
  title: string;
  dateString: string;
  timeString: string;
  sections: SetListSection[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  serviceType: string | null;
  serviceNotes?: {
    theme?: string | null;
    scripture?: string | null;
    notes?: string | null;
  } | null;
  churchId: string;
}

export interface SetListSongEntry {
  id: string;
  songId: string;
  title: string;
  key?: string;
  bpm?: number;
  timeSignature?: string;
  notes?: string;
}

export interface SetListSection {
  id: string;
  title: string;
  songs: SetListSongEntry[];
  notes?: string;
  color?: string;
}

export type SongTag = 'worship' | 'fast' | 'slow' | 'praise' | 'altar' | 'special' | string;

export interface Song {
  id: string;
  churchId: string;
  title: string;
  artist?: string;
  key: string;
  bpm?: number;
  timeSignature?: string;
  lyrics?: string;
  chords?: string;
  tags: SongTag[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SongInput {
  title: string;
  artist?: string;
  key: string;
  bpm?: number;
  timeSignature?: string;
  lyrics?: string;
  chords?: string;
  tags: string[];
}

export interface SystemSettings {
  platformName: string;
  emailProvider: "sendgrid" | "mailgun" | "ses";
  emailFromAddress: string;
  emailReplyToAddress: string;
  emailTemplates: {
    welcomeSubject: string;
    welcomeBody: string;
    passwordResetSubject: string;
    passwordResetBody: string;
  };
  supportEmail: string;
  defaultTimezone: string;
  defaultLocale: string;
  branding: {
    primaryColor: string;
    logoUrl: string;
    loginBackgroundUrl: string;
  };
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowRegistrations: boolean;
  allowChurchCreation: boolean;
  disableEmailSending: boolean;
  featureFlags: {
    attendanceV2: boolean;
    musicPlannerV2: boolean;
    givingAnalytics: boolean;
    checkInKioskMode: boolean;
    multiCampusSupport: boolean;
    aiServicePlanning: boolean;
  };
  logRetentionDays: number;
  autoDeleteInactiveUsersAfterDays: number;
  require2FAForAdmins: boolean;
  maxFailedLoginAttempts: number;
  lockoutDurationMinutes: number;
  updatedAt?: Date | { seconds: number } | null;
  lastIntegrityScan: {
    strayUsers: "",
    orphanedMembers: "",
    churchesWithoutAdmins: "",
    invalidRoles: ""
  },
  debugMode: boolean;
  logAllRequests: boolean;
  showDevToolsInUI: boolean;
}

export interface AppUser {
  uid: string;
  email: string;
  churchId?: string | null;
  regionId?: string | null;
  roles?: Role[];
  rolesByChurch?: {
    [churchId: string]: Role[];
  };
  managedChurchIds?: string[];
  firstName?: string | null;
  lastName?: string | null;
  profilePhotoUrl?: string;
  settings?: {
    attendanceView: "cards" | "list";
    calendarView?: "calendar" | "list";
    cardView?: "show" | "hide";
    fiscalYear?: string | null;
    songSort?: "title" | "artist" | "key" | "bpm";
    attendanceHistory?: {
      breakdown?: "year" | "month" | "week";
      year?: number | null;
      month?: number | null;
      week?: number | null;
    };
    contributionsHistory?: {
      breakdown?: "year" | "month" | "week";
      year?: number | null;
      month?: number | null;
      week?: number | null;
    };
  };
}

export interface SystemUser {
  uid: string;
  churchId?: string;
  roles?: string[];
  [key: string]: any;
}

export type UserProfile = {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  profilePhotoUrl?: string;
  roles: Role[];
  churchId: string | null;
  regionId?: string | null;
};


import { Timestamp } from 'firebase/firestore';
import type { Role } from '@/app/lib/roles';

export type Address = {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
};

export interface AttendanceSummaryItem {
  dateString: string;
  present: number;
  absent: number;
  total: number;
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
  createdAt?: string | null;
  updatedAt?: string | null;
  enabledAt?: string | null;
  disabledAt?: string | null;
  address?: string | null;
  phone?: string | null;
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
};

export type Family = {
  id: string;
  name: string;
};

export type Member = {
  photoUrl: string;
  id: string;
  userId?: string | null;
  checkInCode: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber: string;
  profilePhotoUrl?: string;
  status: 'Active' | 'Prospect' | 'Archived';
  address?: Address;
  birthday?: string;
  baptismDate?: string;
  familyId?: string;
  notes?: string;
  relationships?: Relationship[];
  anniversary?: string;
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

export interface ServicePlan {
  id: string;
  title: string;
  dateString: string;
  timeString: string;
  date: Date;
  dateTime: Date;
  notes: string;
  sections: ServicePlanSection[];

  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export type ServicePlanFirestore = {
  title: string;
  dateString: string;
  timeString: string;
  notes: string;
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
  serviceType: 'Sunday' | 'Midweek' | 'Special' | null;
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
  serviceType: 'Sunday' | 'Midweek' | 'Special' | null;
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

export interface User {
  id: string;
  email: string;
  churchId?: string | null;
  roles: Role[];
  firstName?: string | null;
  lastName?: string | null;
  settings?: {
    attendanceView: "cards" | "list";
    calendarView?: 'calendar' | 'list';
    cardView?: 'show' | 'hide';
    fiscalYear?: string;
  };
}

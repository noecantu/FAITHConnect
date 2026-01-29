
import { Timestamp } from 'firebase/firestore';

export type Address = {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
};

export type Contribution = {
  id: string;
  memberId: string;
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
  date: Date;
  description?: string;
};

export type Family = {
  id: string;
  name: string;
};

export type Member = {
  id: string;
  userId?: string | null;
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

export type Relationship = {
  id?: string;
  memberIds: [string, string];
  type: string;
  anniversary?: string;
};

export interface ServicePlan {
  id: string;
  title: string;
  date: string;
  notes: string;
  sections: ServicePlanSection[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface ServicePlanSection {
  id: string;
  title: string;
  personId: string | null;
  songIds: string[];
  notes: string;
}

export interface SetListSongEntry {
  songId: string;
  title: string;
  key: string;
  notes?: string;
}

export interface SetListSection {
  id: string;
  title: string;
  songs: SetListSongEntry[];
}

export interface SetList {
  id: string;
  churchId: string;
  title: string;
  date: Date;
  sections: SetListSection[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  serviceType?: 'Sunday' | 'Midweek' | 'Special';
  serviceNotes?: {
    theme?: string;
    scripture?: string;
    notes?: string;
  };
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
  displayName?: string;
  email: string;
  roles: string[];
  settings?: {
    calendarView?: 'calendar' | 'list';
    cardView?: 'show' | 'hide';
    fiscalYear?: string;
  };
}
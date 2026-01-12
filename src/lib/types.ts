
import { Timestamp } from 'firebase/firestore';

export type Address = {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
};

export type Family = {
  id: string;
  name: string;
};

export type Relationship = {
  id?: string;
  memberIds: [string, string];
  type: string;
  anniversary?: string;
};

export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber: string;
  profilePhotoUrl: string;
  status: 'Active' | 'Prospect' | 'Archived';
  address?: Address;
  birthday?: string;
  baptismDate?: string;
  familyId?: string;
  notes?: string;
  relationships?: Relationship[];
  anniversary?: string;
  roles?: string[];
};

export type Event = {
  id: string;
  title: string;
  date: Date;
  description?: string;
};

export type Contribution = {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  category: 'Tithes' | 'Offering' | 'Donation' | 'Other';
  contributionType: 'Digital Transfer' | 'Cash' | 'Check' | 'Other';
  date: Date;
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

export interface User {
  id: string;
  displayName?: string;
  email: string;
  roles: string[];
  settings?: {
    calendarView?: 'calendar' | 'list';
    fiscalYear?: string;
  };
}

import type { ImagePlaceholder } from './placeholder-images';

export type Member = {
  id: string;
  photoUrl: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday?: string;
  notes?: string;
  status: 'Active' | 'Prospect' | 'Archived';
  imageHint: string;
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
  date: Date;
};

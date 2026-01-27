import type { Member, Event, Contribution } from './types';

export const members: Member[] = [
  // This data is now invalid with the new type definition.
  // It will be updated or removed in a subsequent step.
];

export const events: Event[] = [
  {
    id: 'e1',
    title: 'Sunday Service',
    date: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())),
    description: 'Weekly Sunday worship service.',
  },
  {
    id: 'e2',
    title: 'Youth Group Meeting',
    date: new Date(new Date().setDate(new Date().getDate() + 3)),
    description: 'Fun and fellowship for teens.',
  },
  {
    id: 'e3',
    title: 'Community Bake Sale',
    date: new Date(new Date().setDate(new Date().getDate() + 12)),
    description: 'Fundraiser for the new community center.',
  },
];

export const contributions: Contribution[] = [
  {
    id: 'c1',
    memberId: 'm1',
    memberName: 'John Doe',
    amount: 100,
    category: 'Tithes',
    date: new Date(new Date().setDate(new Date().getDate() - 5)),
    contributionType: 'Cash',
  },
  {
    id: 'c2',
    memberId: 'm2',
    memberName: 'Jane Smith',
    amount: 50,
    category: 'Offering',
    date: new Date(new Date().setDate(new Date().getDate() - 5)),
    contributionType: 'Digital Transfer',
  },
  {
    id: 'c3',
    memberId: 'm4',
    memberName: 'Mary Williams',
    amount: 250,
    category: 'Donation',
    date: new Date(new Date().setDate(new Date().getDate() - 10)),
    contributionType: 'Check',
  },
  {
    id: 'c4',
    memberId: 'm1',
    memberName: 'John Doe',
    amount: 20,
    category: 'Other',
    date: new Date(new Date().setDate(new Date().getDate() - 12)),
    contributionType: 'Other',
  },
  {
    id: 'c5',
    memberId: 'm2',
    memberName: 'Jane Smith',
    amount: 150,
    category: 'Tithes',
    date: new Date(new Date().setDate(new Date().getDate() - 12)),
    contributionType: 'Digital Transfer',
  },
];

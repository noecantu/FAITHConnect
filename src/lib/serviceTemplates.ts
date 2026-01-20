import type { SetListSongEntry } from '@/lib/types';

export type ServiceTemplateId = 'default' | 'communion' | 'easter' | 'christmas';

interface ServiceTemplate {
  id: ServiceTemplateId;
  name: string;
  description?: string;
  notes?: {
    theme?: string;
    scripture?: string;
    notes?: string;
  };
  // optional: default song slots (by title or tag)
}

export const SERVICE_TEMPLATES: ServiceTemplate[] = [
  {
    id: 'default',
    name: 'Standard Sunday',
  },
  {
    id: 'communion',
    name: 'Communion Sunday',
    notes: {
      theme: 'Communion',
      scripture: '1 Corinthians 11:23-26',
    },
  },
  {
    id: 'easter',
    name: 'Easter Sunday',
    notes: {
      theme: 'Resurrection',
    },
  },
  {
    id: 'christmas',
    name: 'Christmas Service',
    notes: {
      theme: 'Incarnation',
    },
  },
];

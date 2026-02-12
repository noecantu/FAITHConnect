export interface SectionTemplate {
  id: string;
  title: string;
  defaultPersonId?: string | null;
  defaultSongIds?: string[];
  defaultNotes?: string;
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    id: 'opening',
    title: 'Opening',
    defaultNotes: 'Service start or commencement.',
  },
  {
    id: 'praise',
    title: 'Praise',
    defaultNotes: 'Upbeat songs to open the service.',
  },
  {
    id: 'worship',
    title: 'Worship',
    defaultNotes: 'Slower, reflective songs for worship.',
  },
  {
    id: 'offering',
    title: 'Offering',
    defaultNotes: 'Prepare hearts for giving.',
  },
  {
    id: 'message',
    title: 'Message',
    defaultNotes: 'Sermon or preaching time.',
  },
  {
    id: 'altar-call',
    title: 'Altar Call',
    defaultNotes: 'Prayer, ministry, and response.',
  },
  {
    id: 'special-song',
    title: 'Special Song',
    defaultNotes: 'Solo or featured performance.',
  },
];

export const SECTION_TITLES = SECTION_TEMPLATES.map(t => t.title);
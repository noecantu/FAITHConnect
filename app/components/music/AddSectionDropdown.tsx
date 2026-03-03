'use client';

import { useState } from 'react';
import { nanoid } from 'nanoid';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { SetListSection } from '@/app/lib/types';

interface SectionName {
  id: string;
  title: string;
}

interface Props {
  sections: SetListSection[];
  onChange: (sections: SetListSection[]) => void;
  sectionNames: SectionName[];
  fetchSectionNames: () => void;
  justAddedId: string | null;
  setJustAddedId: (id: string | null) => void;
  setIsSectionNameDialogOpen: (open: boolean) => void;
}

export default function AddSectionDropdown({
  sections,
  onChange,
  sectionNames,
  fetchSectionNames,
  justAddedId,
  setJustAddedId,
  setIsSectionNameDialogOpen,
}: Props) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');

  const handleAdd = (title: string) => {
    const newSection: SetListSection = {
      id: nanoid(),
      title,
      songs: [],
      notes: '',
    };

    onChange([...sections, newSection]);
    setCustom('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchSectionNames();
    } else {
      setJustAddedId(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="default">+ Add Section</Button>
      </PopoverTrigger>

      <PopoverContent className="w-56 p-2 space-y-1">

        {sectionNames.map((sn) => {
          const isNew = sn.id === justAddedId;

          return (
            <button
              key={sn.id}
              className={[
                'w-full text-left px-2 py-1 rounded hover:bg-accent',
                isNew
                  ? 'bg-slate-800/70 dark:bg-slate-700/60 border-l-2 border-slate-500/40'
                  : '',
              ].join(' ')}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAdd(sn.title);
              }}
            >
              <span className="flex items-center gap-2">
                {sn.title}
                {isNew && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    New
                  </span>
                )}
              </span>
            </button>
          );
        })}

        <div className="border-t my-2" />

        <Input
          placeholder="Custom section…"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && custom.trim()) {
              e.preventDefault();
              e.stopPropagation();
              handleAdd(custom.trim());
            }
          }}
        />

        <div className="border-t my-2" />

        <button
          className="w-full text-left px-2 py-1 hover:bg-accent rounded text-sm text-muted-foreground"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsSectionNameDialogOpen(true);
          }}
        >
          Manage section names…
        </button>
      </PopoverContent>
    </Popover>
  );
}

'use client';

import { useState } from 'react';
import { nanoid } from 'nanoid';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { SetListSection, Song, SetListSongEntry } from '../../lib/types';
import { SectionSongList } from './SectionSongList';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

const normalize = (str: string) =>
  str.replace(/\s+/g, "").toLowerCase();

const sectionBgColors: Record<string, string> = {
  praise: "rgba(59, 130, 246, 0.08)",
  worship: "rgba(251, 146, 60, 0.08)",
  offering: "rgba(239, 68, 68, 0.08)",
  altarcall: "rgba(34, 197, 94, 0.08)",
  custom: "rgba(234, 179, 8, 0.08)",
};

interface Props {
  sections: SetListSection[];
  onChange: (sections: SetListSection[]) => void;
  allSongs: Song[];
}

export function SetListSectionEditor({ sections, onChange, allSongs }: Props) {

  const updateSection = (id: string, updated: Partial<SetListSection>) => {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  };

  const removeSection = (id: string) => {
    onChange(sections.filter((s) => s.id !== id));
  };

  const moveSection = (from: number, to: number) => {
    if (to < 0 || to >= sections.length) return;
    const updated = [...sections];
    const item = updated.splice(from, 1)[0];
    updated.splice(to, 0, item);
    onChange(updated);
  };

  /* ---------------------------------------------
     Add Section Dropdown
  ---------------------------------------------- */

  const DEFAULT_SECTION_NAMES = [
    'Praise',
    'Worship',
    'Offering',
    'Altar Call',
  ];

  function AddSectionDropdown() {
    const [open, setOpen] = useState(false);
    const [custom, setCustom] = useState('');

    const handleAdd = (title: string) => {
      const newSection: SetListSection = {
        id: nanoid(),
        title,
        songs: [],
      };
      onChange([...sections, newSection]);
      setOpen(false);
      setCustom('');
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline">+ Add Section</Button>
        </PopoverTrigger>

        <PopoverContent className="w-48 p-2 space-y-1">
          {DEFAULT_SECTION_NAMES.map((name) => (
            <button
              key={name}
              className="w-full text-left px-2 py-1 hover:bg-accent rounded"
              onClick={() => handleAdd(name)}
            >
              {name}
            </button>
          ))}

          <div className="border-t my-2" />

          <Input
            placeholder="Custom section…"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && custom.trim()) {
                handleAdd(custom.trim());
              }
            }}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="space-y-4">

      <AddSectionDropdown />

      <div className="space-y-4">
        {sections.map((section, index) => (
          <Card
            key={section.id}
            className="p-4 space-y-4"
            style={{
              backgroundColor:
                sectionBgColors[normalize(section.title)] ?? "transparent",
            }}
          >

            {/* Header Row */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Section {index + 1}
              </span>

              <div className="flex items-center gap-1 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={index === 0}
                  onClick={() => moveSection(index, index - 1)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={index === sections.length - 1}
                  onClick={() => moveSection(index, index + 1)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeSection(section.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>

            {/* Title */}
            <Input
              value={section.title}
              onChange={(e) => updateSection(section.id, { title: e.target.value })}
              className="font-medium"
            />

            {/* Songs */}
            <SectionSongList
              sectionId={section.id}
              songs={section.songs}
              onChange={(songs) => updateSection(section.id, { songs })}
              allSongs={allSongs}
            />

          </Card>
        ))}
      </div>
    </div>
  );
}

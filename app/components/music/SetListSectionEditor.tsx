'use client';

import { useState } from 'react';
import { nanoid } from 'nanoid';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { SetListSection, Song } from '@/app/lib/types';
import { SectionSongList } from './SectionSongList';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { SECTION_TEMPLATES } from '@/app/lib/sectionTemplates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getSectionColor } from '@/app/lib/sectionColors';

const SECTION_TITLES = SECTION_TEMPLATES.map(t => t.title);

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
  function AddSectionDropdown() {
    const [open, setOpen] = useState(false);
    const [custom, setCustom] = useState('');

    const handleAdd = (title: string, notes?: string, songIds?: string[]) => {
      const newSection: SetListSection = {
        id: nanoid(),
        title,
        songs:
        songIds?.map((songId) => {
          const song = allSongs.find((s) => s.id === songId);

          return {
            id: nanoid(),
            songId,
            title: song?.title ?? '', 
            key: song?.key ?? '',
            notes: '',
          };
        }) ?? [],
        notes: notes ?? '',
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

        <PopoverContent className="w-56 p-2 space-y-1">

          {/* Shared templates */}
          {SECTION_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              className="w-full text-left px-2 py-1 hover:bg-accent rounded"
              onClick={() => handleAdd(tpl.title, tpl.defaultNotes, tpl.defaultSongIds)}
            >
              {tpl.title}
            </button>
          ))}

          <div className="border-t my-2" />

          {/* Custom section */}
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
            style={{ backgroundColor: getSectionColor(section.title) }}
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
            <Select
              value={section.title}
              onValueChange={(value) => {
                if (value === "__custom") {
                  updateSection(section.id, { title: "__custom" });
                } else {
                  updateSection(section.id, { title: value });
                }
              }}
            >
              <SelectTrigger className="font-medium">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>

              <SelectContent>
                {SECTION_TITLES.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
                <SelectItem value="__custom">Custom…</SelectItem>
              </SelectContent>
            </Select>

            {section.title === "__custom" && (
              <Input
                autoFocus
                placeholder="Custom section name"
                value={section.title === "__custom" ? "" : section.title}
                onChange={(e) =>
                  updateSection(section.id, { title: e.target.value })
                }
                className="font-medium mt-2"
              />
            )}

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

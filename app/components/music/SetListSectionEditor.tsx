'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ChevronUp, ChevronDown, Trash2, Palette } from 'lucide-react';

import { SetListSection, SetListSongEntry, Song } from '@/app/lib/types';
import { SectionSongList } from './SectionSongList';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';

import { getSectionColor, SECTION_COLOR_PALETTE } from '@/app/lib/sectionColors';
import { useChurchId } from '@/app/hooks/useChurchId';

import { getSupabaseClient } from "@/app/lib/supabase/client";

import SectionNameSelectionDialog from '@/app/components/music/SectionNameSelectionDialog';
import SongSelectionDialog from '@/app/components/music/SongSelectionDialog';

import { nanoid } from 'nanoid';

interface Props {
  sections: SetListSection[];
  onChange: (sections: SetListSection[]) => void;
  allSongs: Song[];
}

interface SectionName {
  id: string;
  title: string;
}

export function SetListSectionEditor({
  sections,
  onChange,
  allSongs,
}: Props) {
  const supabase = getSupabaseClient();
  const { church_id, loading: churchLoading } = useChurchId();

  const [sectionNames, setSectionNames] = useState<SectionName[]>([]);
  const [isSectionNameDialogOpen, setIsSectionNameDialogOpen] = useState(false);

  const [isSongDialogOpen, setIsSongDialogOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  /* ---------------------------------------------
     Fetch Section Names
  ---------------------------------------------- */
  const fetchSectionNames = useCallback(async () => {
    if (!db || !church_id) return;

    try {
      const ref = collection(db, 'churches', church_id, 'sectionNames');
      const q = query(ref, orderBy('title'));
      const snap = await getDocs(q);

      setSectionNames(
        snap.docs.map((d) => ({
          id: d.id,
          title: d.data().title as string,
        }))
      );
    } catch (err) {
      console.error('Error fetching section names:', err);
    }
  }, [church_id]);

  useEffect(() => {
    if (church_id) fetchSectionNames();
  }, [church_id, fetchSectionNames]);

  /* ---------------------------------------------
     Section Helpers
  ---------------------------------------------- */
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

  if (churchLoading || !church_id) return null;

  return (
    <div className="space-y-4">

      {/* Add Section */}
      <Button onClick={() => setIsSectionNameDialogOpen(true)}>
        + Add Section
      </Button>

      <div className="space-y-4">
        {sections.map((section, index) => (
          (() => {
            const isCustomTitle = section.title.trim().length > 0
              && !sectionNames.some((sn) => sn.title === section.title);
            const showCustomInput = isCustomTitle || section.title === '';
            const selectValue = showCustomInput ? '__custom' : section.title;

            return (
          <Card
            key={section.id}
            className="p-4 space-y-4"
            style={{ backgroundColor: section.color ?? getSectionColor(section.title) }}
          >
            {/* Header */}
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

                {/* Color Picker */}
                <Popover>
                  {(() => {
                    const activeEntry = SECTION_COLOR_PALETTE.find(c => c.bg === section.color);
                    return (
                      <PopoverTrigger
                        title="Set section color"
                        className="inline-flex items-center justify-center rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        style={activeEntry
                          ? { border: `1.5px solid ${activeEntry.solid}`, boxShadow: `0 0 0 1px ${activeEntry.solid}`, height: '2.25rem', width: '2.25rem' }
                          : { background: 'linear-gradient(135deg,#8b5cf6,#3b82f6,#22c55e,#eab308,#ef4444)', padding: '1.5px', height: '2.25rem', width: '2.25rem' }
                        }
                      >
                        <span className="flex items-center justify-center w-full h-full rounded-[calc(0.375rem-1px)] bg-background">
                          <Palette className="h-4 w-4" style={{ color: activeEntry?.solid }} />
                        </span>
                      </PopoverTrigger>
                    );
                  })()}
                  <PopoverContent className="w-auto p-2" align="end">
                    <p className="text-xs text-muted-foreground mb-2">Section color</p>
                    <div className="flex flex-wrap gap-1.5 max-w-[160px]">
                      {SECTION_COLOR_PALETTE.map((c) => (
                        <button
                          key={c.label}
                          type="button"
                          title={c.label}
                          onClick={() => updateSection(section.id, { color: c.bg })}
                          className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                          style={{
                            backgroundColor: c.solid,
                            borderColor: section.color === c.bg ? 'white' : 'transparent',
                          }}
                        />
                      ))}
                      {/* Reset to default */}
                      <button
                        type="button"
                        title="Default (auto)"
                        onClick={() => updateSection(section.id, { color: undefined })}
                        className="h-6 w-6 rounded-full border-2 border-white/30 bg-white/10 text-[10px] font-bold hover:bg-white/20 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>

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

            {/* Section Title */}
            <Select
              value={selectValue}
              onValueChange={(value) => {
                if (value === '__custom') {
                  if (!isCustomTitle) {
                    updateSection(section.id, { title: '' });
                  }
                  return;
                }
                updateSection(section.id, { title: value });
              }}
            >
              <SelectTrigger className="font-medium">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>

              <SelectContent>
                {sectionNames.map((sn) => (
                  <SelectItem key={sn.id} value={sn.title}>
                    {sn.title}
                  </SelectItem>
                ))}
                <SelectItem value="__custom">Custom…</SelectItem>
              </SelectContent>
            </Select>

            {showCustomInput && (
              <Input
                autoFocus
                placeholder="Custom section name"
                value={section.title}
                onChange={(e) =>
                  updateSection(section.id, { title: e.target.value })
                }
                className="font-medium mt-2"
              />
            )}

            {/* Add Song */}
            <Button
              variant="outline"
              onClick={() => {
                setActiveSectionId(section.id);
                setIsSongDialogOpen(true);
              }}
            >
              + Add Song
            </Button>

            {/* Songs */}
            <SectionSongList
              sectionId={section.id}
              songs={section.songs}
              onChange={(songs) => updateSection(section.id, { songs })}
              allSongs={allSongs}
            />
          </Card>
            );
          })()
        ))}
      </div>

      {/* Section Name Dialog */}
      <SectionNameSelectionDialog
        isOpen={isSectionNameDialogOpen}
        onOpenChange={setIsSectionNameDialogOpen}
        onSelect={(selectedTitle) => {
          if (!selectedTitle) return;

          const newSection: SetListSection = {
            id: nanoid(),
            title: selectedTitle,
            songs: [],
            notes: '',
          };

          onChange([...sections, newSection]);
        }}
        church_id={church_id}
      />

      {/* Song Selection Dialog */}
      <SongSelectionDialog
        isOpen={isSongDialogOpen}
        onOpenChange={setIsSongDialogOpen}
        songs={allSongs}
        onSelect={(songId) => {
          if (!activeSectionId) return;

          const section = sections.find((s) => s.id === activeSectionId);
          if (!section) return;

          const song = allSongs.find((s) => s.id === songId);
          if (!song) return;

          const entry: SetListSongEntry = {
            id: nanoid(),
            songId: song.id,
            title: song.title,
            key: song.key,
            bpm: song.bpm,
            timeSignature: song.timeSignature,
            notes: '',
          };

          updateSection(activeSectionId, {
            songs: [...section.songs, entry],
          });
        }}
      />
    </div>
  );
}

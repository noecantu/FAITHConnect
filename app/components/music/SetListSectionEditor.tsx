'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { SetListSection, SetListSongEntry, Song } from '@/app/lib/types';
import { SectionSongList } from './SectionSongList';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getSectionColor } from '@/app/lib/sectionColors';
import { useChurchId } from '@/app/hooks/useChurchId';
import { db } from '@/app/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import SectionNameSelectionDialog from '@/app/components/music/SectionNameSelectionDialog';
import SongSelectionDialog from '@/app/components/music/SongSelectionDialog';
import { nanoid } from "nanoid";

interface Props {
  sections: SetListSection[];
  onChange: (sections: SetListSection[]) => void;
  allSongs: Song[];
}

interface SectionName {
  id: string;
  title: string;
}

export function SetListSectionEditor({ sections, onChange, allSongs }: Props) {
  const { churchId, loading: churchLoading } = useChurchId();

  const [sectionNames, setSectionNames] = useState<SectionName[]>([]);
  const [isSectionNameDialogOpen, setIsSectionNameDialogOpen] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Song dialog state
  const [isSongDialogOpen, setIsSongDialogOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const fetchSectionNames = useCallback(async () => {
    if (!db || !churchId) return;

    try {
      const ref = collection(db, 'churches', churchId, 'sectionNames');
      const q = query(ref, orderBy('title'));
      const snap = await getDocs(q);

      const fetched: SectionName[] = snap.docs.map((d) => ({
        id: d.id,
        title: d.data().title as string,
      }));

      setSectionNames(fetched);
    } catch (err) {
      console.error('Error fetching section names:', err);
    }
  }, [churchId]);

  useEffect(() => {
    if (churchId) fetchSectionNames();
  }, [churchId, fetchSectionNames]);

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

  if (churchLoading || !churchId) return null;

  return (
    <div className="space-y-4">

      {/* Add Section → opens dialog */}
      <Button
        variant="default"
        onClick={() => setIsSectionNameDialogOpen(true)}
      >
        + Add Section
      </Button>

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

            {/* Section Title Select */}
            <Select
              value={section.title}
              onValueChange={(value) => {
                if (value === '__custom') {
                  updateSection(section.id, { title: '__custom' });
                } else {
                  updateSection(section.id, { title: value });
                }
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

            {section.title === '__custom' && (
              <Input
                autoFocus
                placeholder="Custom section name"
                value={section.title === '__custom' ? '' : section.title}
                onChange={(e) =>
                  updateSection(section.id, { title: e.target.value })
                }
                className="font-medium mt-2"
              />
            )}

            {/* Add Song Button */}
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
        ))}
      </div>

      {/* Section Name Dialog */}
      <SectionNameSelectionDialog
        isOpen={isSectionNameDialogOpen}
        onOpenChange={setIsSectionNameDialogOpen}
        onSelect={async (newId) => {
          if (!newId) return;

          // Fetch fresh names to avoid stale state
          const ref = collection(db, 'churches', churchId, 'sectionNames');
          const snap = await getDocs(ref);
          const freshNames = snap.docs.map((d) => ({
            id: d.id,
            title: d.data().title as string,
          }));

          const sn = freshNames.find((s) => s.id === newId);
          if (!sn) return;

          const newSection: SetListSection = {
            id: nanoid(),
            title: sn.title,
            songs: [],
            notes: '',
          };

          onChange([...sections, newSection]);
          setJustAddedId(newId);
          setSectionNames(freshNames);
        }}
        churchId={churchId}
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

'use client';

import { useState } from 'react';
import { GripVertical, Trash, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { ServicePlanSection } from '@/lib/types';
import { nanoid } from 'nanoid';

import { useChurchId } from '@/hooks/useChurchId';
import { useMembers } from '@/hooks/useMembers';
import { useSongs } from '@/hooks/useSongs';

import { MemberSelect } from '@/components/service-plans/MemberSelect';
import { SongSelect } from '@/components/service-plans/SongSelect';
import { SectionTitleSelect } from '@/components/service-plans/SectionTitleSelect';
import { Separator } from '@/components/ui/separator';

interface Props {
  sections: ServicePlanSection[];
  onChange: (sections: ServicePlanSection[]) => void;
}

export function ServicePlanSectionEditorSimple({ sections, onChange }: Props) {
  const churchId = useChurchId();
  const { members } = useMembers(churchId);
  const { songs } = useSongs(churchId);

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function addSection() {
    const newSection: ServicePlanSection = {
      id: nanoid(),
      title: 'Praise',
      personId: null,
      songIds: [],
      notes: ''
    };
    onChange([...sections, newSection]);
  }

  function updateSection(index: number, updated: Partial<ServicePlanSection>) {
    const copy = [...sections];
    copy[index] = { ...copy[index], ...updated };
    onChange(copy);
  }

  function removeSection(index: number) {
    const copy = [...sections];
    copy.splice(index, 1);
    onChange(copy);
  }

  function moveSection(from: number, to: number) {
    const copy = [...sections];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    onChange(copy);
  }

  function addSong(index: number) {
    updateSection(index, { songIds: [...sections[index].songIds, ''] });
  }

  function updateSong(index: number, songIndex: number, songId: string | null) {
    const updated = [...sections[index].songIds];
    if (songId === null) {
      updated.splice(songIndex, 1);
    } else {
      updated[songIndex] = songId;
    }
    updateSection(index, { songIds: updated });
  }

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <Card
          key={section.id}
          className="p-5 space-y-5"
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex !== null && dragIndex !== index) {
              moveSection(dragIndex, index);
            }
            setDragIndex(null);
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-base">Section {index + 1}</h3>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeSection(index)}
            >
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <SectionTitleSelect
              value={section.title}
              onChange={(title) => updateSection(index, { title })}
            />
          </div>

          <Separator />

          {/* Person */}
          <div>
            <label className="text-sm font-medium mb-1 block">Person</label>
            <MemberSelect
              members={members}
              value={section.personId}
              onChange={(id) => updateSection(index, { personId: id })}
            />
          </div>

          {/* Songs */}
          <div className="space-y-2">
            <label className="text-sm font-medium block">Songs</label>

            {section.songIds.map((songId, songIndex) => (
              <div key={songIndex} className="flex items-center gap-2">
                <SongSelect
                  songs={songs}
                  value={songId}
                  onChange={(id) => updateSong(index, songIndex, id)}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateSong(index, songIndex, null)}
                >
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}

            <Button
              variant="secondary"
              size="sm"
              className="mt-1"
              onClick={() => addSong(index)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Song
            </Button>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-1 block">Notes</label>
            <Textarea
              className="bg-background text-foreground"
              rows={3}
              value={section.notes || ''}
              onChange={(e) =>
                updateSection(index, { notes: e.target.value })
              }
            />
          </div>
        </Card>
      ))}

      <Button variant="secondary" onClick={addSection}>
        Add Section
      </Button>
    </div>
  );
}

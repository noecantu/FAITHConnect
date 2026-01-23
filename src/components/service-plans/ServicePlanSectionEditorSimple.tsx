'use client';

import { GripVertical, Trash } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { ServicePlanSection } from '@/lib/types';
import { nanoid } from 'nanoid';
import { useState } from 'react';

interface Props {
  sections: ServicePlanSection[];
  onChange: (sections: ServicePlanSection[]) => void;
}

export function ServicePlanSectionEditorSimple({ sections, onChange }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function addSection() {
    const newSection: ServicePlanSection = {
      id: nanoid(),
      title: 'New Section',
      personId: '',
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

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <Card
          key={section.id}
          className="p-4 space-y-4 border bg-muted/30 rounded-md"
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
            <Input
              className="bg-background text-foreground"
              value={section.title}
              onChange={(e) =>
                updateSection(index, { title: e.target.value })
              }
            />
          </div>

          {/* Song IDs */}
          <div>
            <label className="text-sm font-medium mb-1 block">Song IDs</label>
            <Textarea
              className="bg-background text-foreground"
              rows={3}
              value={section.songIds.join('\n')}
              onChange={(e) =>
                updateSection(index, {
                  songIds: e.target.value.split('\n').filter(Boolean)
                })
              }
            />
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

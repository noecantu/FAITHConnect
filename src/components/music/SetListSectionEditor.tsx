'use client';

import { useState } from 'react';
import { nanoid } from 'nanoid';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import { SetListSection, Song, SetListSongEntry } from '@/lib/types';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';
import { SectionSongList } from '@/components/music/SectionSongList';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Props {
  sections: SetListSection[];
  onChange: (sections: SetListSection[]) => void;
  allSongs: Song[];
}

export function SetListSectionEditor({ sections, onChange, allSongs }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const updateSection = (id: string, updated: Partial<SetListSection>) => {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  };

  const removeSection = (id: string) => {
    onChange(sections.filter((s) => s.id !== id));
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);

    onChange(arrayMove(sections, oldIndex, newIndex));
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

      {/* Add Section Dropdown */}
      <AddSectionDropdown />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {sections.map((section) => (
              <SortableSectionItem
                key={section.id}
                section={section}
                onRename={(title) => updateSection(section.id, { title })}
                onDelete={() => removeSection(section.id)}
                onUpdateSongs={(songs) =>
                  updateSection(section.id, { songs })
                }
                allSongs={allSongs}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <Card className="p-4 opacity-80 flex items-center gap-3">
              <GripVertical className="text-muted-foreground" />
              <p className="font-medium">
                {sections.find((s) => s.id === activeId)?.title}
              </p>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

/* ---------------------------------------------
   Sortable Section Item
---------------------------------------------- */

function SortableSectionItem({
  section,
  onRename,
  onDelete,
  onUpdateSongs,
  allSongs,
}: {
  section: SetListSection;
  onRename: (title: string) => void;
  onDelete: () => void;
  onUpdateSongs: (songs: SetListSongEntry[]) => void;
  allSongs: Song[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4 space-y-4">

      {/* Section Header */}
      <div className="flex items-center gap-3">
        <GripVertical
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground"
        />

        <Input
          value={section.title}
          onChange={(e) => onRename(e.target.value)}
          className="font-medium"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="ml-auto"
        >
          <Trash2 />
        </Button>
      </div>

      {/* Songs inside this section */}
      <SectionSongList
        sectionId={section.id}
        songs={section.songs}
        onChange={onUpdateSongs}
        allSongs={allSongs}
      />
    </Card>
  );
}

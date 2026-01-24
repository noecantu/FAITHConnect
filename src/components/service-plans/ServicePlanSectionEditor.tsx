'use client';

import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

import { SortableItem } from './SectionReorderHandle';
import { MemberSelect } from './MemberSelect';
import { AddSongDropdown } from './AddSongDropdown';
import { ServicePlanSongRow } from './ServicePlanSongRow';

import type { Member, Song } from '@/lib/types';

interface Props {
  section: any; // field from useFieldArray
  index: number;
  members: Member[];
  songs: Song[];
  remove: () => void;
  register: any;
  control: any;
}

export function ServicePlanSectionEditor({
  section,
  index,
  members,
  songs,
  remove,
  register,
  control,
}: Props) {
  return (
    <SortableItem id={section.id}>
      {(dragHandleProps, setActivatorNodeRef) => (
        <div className="border rounded-md p-4 space-y-4 bg-muted/30">

          <div className="flex justify-between items-center">
            <div
              ref={setActivatorNodeRef}
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing text-muted-foreground"
            >
              ⋮⋮
            </div>

            <Button variant="destructive" size="sm" onClick={remove}>
              Delete
            </Button>
          </div>

          {/* Section Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Section Title</label>
            <Input
              {...register(`sections.${index}.title`)}
              placeholder="e.g., MC, Praise, Worship, Preaching"
            />
          </div>

          {/* Person */}
          <div>
            <label className="block text-sm font-medium mb-1">Person</label>
            <Controller
              control={control}
              name={`sections.${index}.personId`}
              render={({ field }) => (
                <MemberSelect
                  members={members}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Songs */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Songs</label>

            <Controller
              control={control}
              name={`sections.${index}.songIds`}
              render={({ field }) => (
                <div className="space-y-2">
                  {field.value.map((songId: string) => {
                    const song = songs.find((s) => s.id === songId);
                    if (!song) return null;

                    return (
                      <ServicePlanSongRow
                        key={songId}
                        song={song}
                        onRemove={() =>
                          field.onChange(field.value.filter((id: string) => id !== songId))
                        }
                      />
                    );
                  })}

                  <AddSongDropdown
                    songs={songs}
                    onSelect={(songId) =>
                      field.onChange([...field.value, songId])
                    }
                  />
                </div>
              )}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Textarea
              {...register(`sections.${index}.notes`)}
              placeholder="Optional notes for this section"
            />
          </div>
        </div>
      )}
    </SortableItem>

  );
}

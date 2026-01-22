'use client';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

export function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag handle positioned top-left */}
      <div
        {...attributes}
        {...listeners}
        className="
          absolute -left-6 top-2
          cursor-grab active:cursor-grabbing
          text-muted-foreground
        "
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {children}
    </div>
  );
}

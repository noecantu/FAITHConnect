'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { createServicePlan, updateServicePlan } from '@/lib/servicePlans';
import type { ServicePlan, ServicePlanSection } from '@/lib/types';

import { DndContext, closestCenter } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { ServicePlanSectionEditor } from './ServicePlanSectionEditor';
import { useMembers } from '@/hooks/useMembers';
import { useSongs } from '@/hooks/useSongs';

const sectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Section title is required'),
  personId: z.string().nullable(),
  songIds: z.array(z.string()),
  notes: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
  sections: z.array(sectionSchema),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  churchId: string;
  plan: ServicePlan | null; // null = Add mode
}

export function ServicePlanFormDialog({ isOpen, onClose, churchId, plan }: Props) {
  const isEdit = !!plan;

  const { members } = useMembers(churchId);
  const { songs } = useSongs(churchId);  

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: plan?.title ?? '',
      date: plan?.date ?? '',
      notes: plan?.notes ?? '',
      sections: plan?.sections ?? [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'sections',
    keyName: 'key',
  });

  // Reset form when switching between Add/Edit
  useEffect(() => {
    form.reset({
      title: plan?.title ?? '',
      date: plan?.date ?? '',
      notes: plan?.notes ?? '',
      sections: plan?.sections ?? [],
    });
  }, [plan, form]);

  async function onSubmit(values: FormValues) {
    const normalized = {
      ...values,
      notes: values.notes ?? '',
      sections: values.sections.map(s => ({
        ...s,
        notes: s.notes ?? '',
      })),
    };
  
    if (isEdit && plan) {
      await updateServicePlan(churchId, plan.id, normalized);
    } else {
      await createServicePlan(churchId, {
        ...normalized,
        createdBy: 'system',
      });
    }
  
    onClose();
  }  

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    move(oldIndex, newIndex);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent
        aria-describedby={undefined}
        className="
          max-h-[90vh] overflow-y-auto
          w-[95vw] sm:w-[700px]
        "
        onOpenAutoFocus={(e) => e.preventDefault()}
      >

        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Service Plan' : 'Add Service Plan'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input {...form.register('title')} />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <Input type="date" {...form.register('date')} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Textarea {...form.register('notes')} />
          </div>

          {/* Sections */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Sections</h3>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    id: crypto.randomUUID(),
                    title: '',
                    personId: null,
                    songIds: [],
                    notes: '',
                  })
                }
              >
                Add Section
              </Button>
            </div>

            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {fields.map((field, index) => (
                  <ServicePlanSectionEditor
                    key={field.id}
                    section={field}
                    index={index}
                    members={members}
                    songs={songs}
                    remove={() => remove(index)}
                    register={form.register}
                    control={form.control}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEdit ? 'Save Changes' : 'Create Service Plan'}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}

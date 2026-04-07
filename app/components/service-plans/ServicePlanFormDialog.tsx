//app/components/service-plans/ServicePlanFormDialog.tsx
'use client';

import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '../ui/form';

import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';

import { createServicePlan, updateServicePlan } from '@/app/lib/servicePlans';
import type { ServicePlan, ServicePlanSection } from '@/app/lib/types';
import { useMembers } from '@/app/hooks/useMembers';
import { useSongs } from '@/app/hooks/useSongs';

import dayjs from 'dayjs';
import { SectionEditor } from './SectionEditor';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { SECTION_TEMPLATES } from '@/app/lib/sectionTemplates';
import { useState } from 'react';

// ZOD SCHEMAS — NEW ARCHITECTURE
const sectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Section title is required'),
  personId: z.string().nullable(),
  songIds: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),

  // NEW: canonical string fields
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  timeString: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time'),

  notes: z.string().optional(),
  sections: z.array(sectionSchema),
});

type FormValues = z.infer<typeof formSchema>;

// SUBMIT HANDLER — NEW ARCHITECTURE
async function handleServicePlanSubmit(
  values: FormValues,
  plan: ServicePlan | null,
  churchId: string,
  onClose: () => void
) {

  const normalizedSections: ServicePlanSection[] = values.sections.map((s) => ({
    id: s.id ?? crypto.randomUUID(),
    title: s.title,
    personId: s.personId ?? null,
    notes: s.notes ?? '',
    songIds: Array.isArray(s.songIds) ? s.songIds : [],
  }));

  const payload = {
    title: values.title.trim(),
    dateString: values.dateString,
    timeString: values.timeString,
    notes: values.notes?.trim() ?? '',
    sections: normalizedSections,
    createdBy: plan?.createdBy ?? 'system',
    // ⭐ Visibility defaults
    isPublic: plan?.isPublic ?? true,
    groups: plan?.groups ?? [],
  };

  if (plan) {
    await updateServicePlan(churchId, plan.id, payload);
  } else {
    await createServicePlan(churchId, payload);
  }

  onClose();
}

// COMPONENT
interface Props {
  isOpen: boolean;
  onClose: () => void;
  churchId: string;
  plan: ServicePlan | null;
}

export function ServicePlanFormDialog({ isOpen, onClose, churchId, plan }: Props) {
  const isEdit = !!plan;
  // Local state for date/time — identical to Set Lists
  const [localDateString, setLocalDateString] = useState(
    plan?.dateString ?? dayjs().format("YYYY-MM-DD")
  );

  const [localTimeString, setLocalTimeString] = useState(
    plan?.timeString ?? "10:00"
  );
  const { members } = useMembers();
  const { songs } = useSongs(churchId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: plan?.title ?? '',

      dateString: plan?.dateString ?? dayjs().format('YYYY-MM-DD'),
      timeString: plan?.timeString ?? '10:00',

      notes: plan?.notes ?? '',
      sections:
        plan?.sections?.map((s) => ({
          id: s.id,
          title: s.title,
          personId: s.personId ?? null,
          songIds: s.songIds ?? [],
          notes: s.notes ?? '',
        })) ?? [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'sections',
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent
        className="w-[95vw] max-w-3xl max-h-[85dvh] flex flex-col p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle>{isEdit ? "Edit Service Plan" : "Add Service Plan"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this service plan." : "Create a new service plan."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6 py-2">
          <Form {...form}>
            <form
              id="service-plan-form"
              onSubmit={form.handleSubmit((values) =>
                handleServicePlanSubmit(
                  {
                    ...values,
                    dateString: localDateString,
                    timeString: localTimeString,
                  },
                  plan,
                  churchId,
                  onClose
                )
              )}
              className="space-y-6"
            >
              {/* Date & Time */}
              <FormItem>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Date */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium">Date</label>
                    <Input
                      type="date"
                      value={localDateString}
                      onChange={(e) => {
                        const value = e.target.value
                        setLocalDateString(value)
                        form.setValue("dateString", value)
                      }}
                      className="w-full"
                    />
                  </div>

                  {/* Time */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium">Time</label>
                    <Input
                      type="time"
                      value={localTimeString}
                      onChange={(e) => {
                        const value = e.target.value
                        setLocalTimeString(value)
                        form.setValue("timeString", value)
                      }}
                      className="w-full"
                    />
                  </div>

                </div>
                <FormMessage />
              </FormItem>

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Sunday Service, Youth Night, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Optional notes…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sections */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">Sections</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">Add Section</Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-56">
                      {SECTION_TEMPLATES.map((tpl) => (
                        <DropdownMenuItem
                          key={tpl.id}
                          onClick={() =>
                            append({
                              title: tpl.title,
                              personId: tpl.defaultPersonId ?? null,
                              songIds: tpl.defaultSongIds ?? [],
                              notes: tpl.defaultNotes ?? "",
                            })
                          }
                        >
                          {tpl.title}
                        </DropdownMenuItem>
                      ))}

                      <DropdownMenuItem
                        onClick={() =>
                          append({
                            title: "",
                            personId: null,
                            songIds: [],
                            notes: "",
                          })
                        }
                      >
                        Custom Section
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {fields.map((field, index) => (
                  <SectionEditor
                    key={field.id}
                    index={index}
                    members={members}
                    songs={songs}
                    remove={() => remove(index)}
                    moveUp={() => index > 0 && move(index, index - 1)}
                    moveDown={() => index < fields.length - 1 && move(index, index + 1)}
                    isFirst={index === 0}
                    isLast={index === fields.length - 1}
                  />
                ))}
              </div>
            </form>
          </Form>
        </div>

        <DialogFooter className="shrink-0 border-t px-6 pb-6 pt-4 flex justify-end gap-2">
          <Button type="submit" form="service-plan-form">
            {isEdit ? "Save Changes" : "Create Service Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import * as React from 'react';
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
} from '@/components/ui/dialog';

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

import { createServicePlan, updateServicePlan } from '@/lib/servicePlans';
import type { ServicePlan, ServicePlanSection } from '@/lib/types';
import { useMembers } from '@/hooks/useMembers';
import { useSongs } from '@/hooks/useSongs';

const sectionSchema = z.object({
  title: z.string().min(1, 'Section title is required'),
  personId: z.string().nullable(),
  songId: z.string().nullable(),
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
  plan: ServicePlan | null;
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
      sections: plan?.sections?.map(s => ({
        title: s.title,
        personId: s.personId ?? null,
        songId: s.songIds?.[0] ?? null,
        notes: s.notes ?? '',
      })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'sections',
  });

  async function onSubmit(values: FormValues) {
    const normalizedSections: ServicePlanSection[] = values.sections.map(s => ({
      id: crypto.randomUUID(),
      title: s.title,
      personId: s.personId,
      songIds: s.songId ? [s.songId] : [],
      notes: s.notes ?? '',
    }));

    const payload = {
      title: values.title.trim(),
      date: new Date(values.date).toISOString(),
      notes: values.notes?.trim() ?? '',
      sections: normalizedSections,
      createdBy: plan?.createdBy ?? 'system',
      createdAt: plan?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    if (isEdit && plan) {
      await updateServicePlan(churchId, plan.id, payload);
    } else {
      await createServicePlan(churchId, payload);
    }

    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[95vw] max-w-3xl max-h-[85dvh] flex flex-col p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle>{isEdit ? 'Edit Service Plan' : 'Add Service Plan'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update this service plan.' : 'Create a new service plan.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6 py-4">
          <Form {...form}>
            <form id="service-plan-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

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

              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      append({
                        title: '',
                        personId: null,
                        songId: null,
                        notes: '',
                      })
                    }
                  >
                    Add Section
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-md p-4 space-y-4 bg-muted/30">

                    {/* Section Title */}
                    <FormField
                      control={form.control}
                      name={`sections.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section Title</FormLabel>
                          <FormControl>
                            <Input placeholder="MC, Worship, Preaching…" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Person */}
                    <FormField
                      control={form.control}
                      name={`sections.${index}.personId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Person</FormLabel>
                          <Select value={field.value ?? ''} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a person" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {members.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.firstName} {m.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Song */}
                    <FormField
                      control={form.control}
                      name={`sections.${index}.songId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Song</FormLabel>
                          <Select value={field.value ?? ''} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a song" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {songs.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name={`sections.${index}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Optional notes…" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button variant="destructive" size="sm" onClick={() => remove(index)}>
                      Delete Section
                    </Button>
                  </div>
                ))}
              </div>

            </form>
          </Form>
        </div>

        <DialogFooter className="shrink-0 border-t px-6 pb-6 pt-4 flex justify-end gap-2">
          <Button type="submit" form="service-plan-form">
            {isEdit ? 'Save Changes' : 'Create Service Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

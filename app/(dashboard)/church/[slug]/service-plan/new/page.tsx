//app/(dashboard)/service-plan/new/page.tsx
'use client';

import * as z from 'zod';
import dayjs from 'dayjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '@/app/components/page-header';
import { Card } from '@/app/components/ui/card';
import { Fab } from '@/app/components/ui/fab';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form';

import { useChurchId } from '@/app/hooks/useChurchId';
import { usePermissions } from '@/app/hooks/usePermissions';
import { useMembers } from '@/app/hooks/useMembers';
import { createServicePlan } from '@/app/lib/servicePlans';
import { SectionEditor } from '@/app/components/service-plans/SectionEditor';
import SectionNameDialog from '@/app/components/music/SectionNameSelectionDialog';

const sectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Section title is required'),
  personId: z.string().nullable(),
  songIds: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  timeString: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time'),
  notes: z.string().optional(),
  sections: z.array(sectionSchema),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewServicePlanPage() {
  const router = useRouter();
  const { churchId, loading: churchLoading } = useChurchId();
  const { canManageServicePlans, loading: rolesLoading } = usePermissions();
  const { members } = useMembers();

  const [isSectionNameDialogOpen, setIsSectionNameDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      dateString: dayjs().format('YYYY-MM-DD'),
      timeString: '10:00',
      notes: '',
      sections: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'sections',
  });

  const watchedTitle = form.watch('title');
  const watchedDate = form.watch('dateString');
  const watchedTime = form.watch('timeString');
  const watchedSections = form.watch('sections');
  const hasValidSectionTitles = (watchedSections ?? []).every(
    (section) => section.title.trim().length > 0
  );
  const canSave =
    watchedTitle.trim().length > 0 &&
    watchedDate.trim().length > 0 &&
    watchedTime.trim().length > 0 &&
    hasValidSectionTitles;

  if (churchLoading) {
    return (
      <>
        <PageHeader title="Create New Service Plan" />
        <p className="text-muted-foreground">Loading…</p>
      </>
    );
  }

  if (!churchId) {
    return (
      <>
        <PageHeader title="Create New Service Plan" />
        <p className="text-muted-foreground">Unable to determine church context.</p>
      </>
    );
  }

  if (rolesLoading) {
    return (
      <>
        <PageHeader title="Create New Service Plan" />
        <p className="text-muted-foreground">Loading permissions…</p>
      </>
    );
  }

  if (!canManageServicePlans) {
    return (
      <>
        <PageHeader title="Create New Service Plan" />
        <p className="text-muted-foreground">You do not have permission to create service plans.</p>
      </>
    );
  }

  const handleCreate = async (values: FormValues) => {
    const created = await createServicePlan(churchId, {
      title: values.title.trim(),
      dateString: values.dateString,
      timeString: values.timeString,
      notes: values.notes?.trim() ?? '',
      sections: values.sections.map((s) => ({
        id: s.id ?? crypto.randomUUID(),
        title: s.title,
        personId: s.personId ?? null,
        notes: s.notes ?? '',
        songIds: Array.isArray(s.songIds) ? s.songIds : [],
      })),
      createdBy: 'system',
    });

    router.push(`/church/${churchId}/service-plan/${created.id}`);
  };

  return (
    <>
      <PageHeader title="Create New Service Plan" />

      <Card className="p-6 space-y-4 relative bg-black/80 border-white/20 backdrop-blur-xl">
        <Form {...form}>
          <form
            id="new-service-plan-form"
            onSubmit={form.handleSubmit(handleCreate)}
            className="space-y-6"
          >
            <FormItem>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={watchedDate}
                    onChange={(e) => form.setValue('dateString', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <Input
                    type="time"
                    value={watchedTime}
                    onChange={(e) => form.setValue('timeString', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <FormMessage />
            </FormItem>

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

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Sections</h3>
                <Button variant="outline" type="button" onClick={() => setIsSectionNameDialogOpen(true)}>
                  Add Section
                </Button>
              </div>

              {fields.map((field, index) => (
                <SectionEditor
                  key={field.id}
                  index={index}
                  churchId={churchId}
                  members={members}
                  remove={() => remove(index)}
                  moveUp={() => index > 0 && move(index, index - 1)}
                  moveDown={() => index < fields.length - 1 && move(index, index + 1)}
                  isFirst={index === 0}
                  isLast={index === fields.length - 1}
                />
              ))}

              <SectionNameDialog
                isOpen={isSectionNameDialogOpen}
                onOpenChange={setIsSectionNameDialogOpen}
                churchId={churchId}
                onSelect={(selectedTitle) => {
                  if (!selectedTitle) return;

                  append({
                    title: selectedTitle,
                    personId: null,
                    songIds: [],
                    notes: '',
                  });
                }}
              />
            </div>
          </form>
        </Form>
      </Card>

      <Fab
        type="save"
        onClick={() => form.handleSubmit(handleCreate)()}
        disabled={!canSave || form.formState.isSubmitting}
      />
    </>
  );
}

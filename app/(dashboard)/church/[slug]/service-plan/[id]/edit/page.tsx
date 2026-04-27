//app/(dashbooard)/service-plan/[id]/edit/page.tsx
'use client';

import * as z from 'zod';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';

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

import { useServicePlan } from '@/app/hooks/useServicePlan';
import { useChurchId } from '@/app/hooks/useChurchId';
import { usePermissions } from '@/app/hooks/usePermissions';
import { useMembers } from '@/app/hooks/useMembers';
import { updateServicePlan } from '@/app/lib/servicePlans';
import { SectionEditor } from '@/app/components/service-plans/SectionEditor';
import SectionNameDialog from '@/app/components/music/SectionNameSelectionDialog';

const sectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Section title is required'),
  personId: z.string().nullable(),
  songIds: z.array(z.string()).default([]),
  notes: z.string().optional(),
  color: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  timeString: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time'),
  notes: z.string().optional(),
  sections: z.array(sectionSchema),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditServicePlanPage() {
  const router = useRouter();
  const { id } = useParams();
  const { churchId, loading: churchLoading } = useChurchId();
  const { canManageServicePlans, loading: rolesLoading } = usePermissions();
  const { members } = useMembers();
  const { plan, loading } = useServicePlan(churchId ?? undefined, id as string);
  const [isSectionNameDialogOpen, setIsSectionNameDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      dateString: '',
      timeString: '',
      notes: '',
      sections: [],
    },
  });

  useEffect(() => {
    if (!plan) return;

    form.reset({
      title: plan.title ?? '',
      dateString: plan.dateString ?? '',
      timeString: plan.timeString ?? '',
      notes: plan.notes ?? '',
      sections: plan.sections?.map((section: any) => ({
        id: section.id,
        title: section.title,
        personId: section.personId ?? null,
        songIds: section.songIds ?? [],
        notes: section.notes ?? '',
        color: section.color,
      })) ?? [],
    });
  }, [form, plan]);

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

  if (churchLoading || loading) {
    return (
      <>
        <PageHeader title="Edit Service Plan" />
        <p className="text-muted-foreground">Loading service plan…</p>
      </>
    );
  }

  if (!churchId) {
    return (
      <>
        <PageHeader title="Edit Service Plan" />
        <p className="text-muted-foreground">Unable to determine church context.</p>
      </>
    );
  }

  if (rolesLoading) {
    return (
      <>
        <PageHeader title="Edit Service Plan" />
        <p className="text-muted-foreground">Loading permissions…</p>
      </>
    );
  }

  if (!plan) {
    return (
      <>
        <PageHeader title="Edit Service Plan" />
        <p className="text-muted-foreground">Service Plan not found.</p>
      </>
    );
  }

  if (!canManageServicePlans) {
    return (
      <>
        <PageHeader title="Edit Service Plan" />
        <p className="text-muted-foreground">You do not have permission to edit service plans.</p>
      </>
    );
  }

  const handleUpdate = async (values: FormValues) => {
    await updateServicePlan(churchId, plan.id, {
      title: values.title.trim(),
      dateString: values.dateString,
      timeString: values.timeString,
      notes: values.notes?.trim() ?? '',
      sections: values.sections.map((section) => ({
        id: section.id ?? crypto.randomUUID(),
        title: section.title,
        personId: section.personId ?? null,
        notes: section.notes ?? '',
        songIds: Array.isArray(section.songIds) ? section.songIds : [],
        color: section.color,
      })),
    });

    router.push(`/church/${churchId}/service-plan/${plan.id}`);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title="Edit Service Plan" />
        <Button asChild variant="outline" className="bg-black/80 border-white/20 text-white/80 hover:bg-white/5">
          <Link href={`/church/${churchId}/service-plan`}>Back to Service Plans</Link>
        </Button>
      </div>

      <Card className="p-6 space-y-4 relative bg-black/80 border-white/20 backdrop-blur-xl">
        <Form {...form}>
          <form
            id="edit-service-plan-form"
            onSubmit={form.handleSubmit(handleUpdate)}
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
        onClick={() => form.handleSubmit(handleUpdate)()}
        disabled={!canSave || form.formState.isSubmitting}
      />
    </>
  );
}

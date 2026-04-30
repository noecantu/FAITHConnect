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
import { MultiSelect } from '@/app/components/ui/multi-select';
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
import { EVENT_GROUP_OPTIONS } from '@/app/lib/groupOptions';

const sectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Section title is required'),
  personId: z.string().nullable(),
  personName: z.string().optional(),
  startTime: z.string().optional(),
  durationMinutes: z.coerce.number().int().positive().optional(),
  songIds: z.array(z.string()).default([]),
  notes: z.string().optional(),
  color: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  timeString: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time'),
  theme: z.string().optional(),
  scripture: z.string().optional(),
  notes: z.string().optional(),
  isPublic: z.boolean().default(true),
  groups: z.array(z.string()).default([]),
  sections: z.array(sectionSchema),
}).superRefine((value, ctx) => {
  if (!value.isPublic && value.groups.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select at least one group for private service plans',
      path: ['groups'],
    });
  }
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
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      dateString: '',
      timeString: '',
      notes: '',
      isPublic: true,
      groups: [],
      sections: [],
    },
  });

  useEffect(() => {
    if (!plan) return;

    form.reset({
      title: plan.title ?? '',
      dateString: plan.dateString ?? '',
      timeString: plan.timeString ?? '',
      theme: plan.theme ?? '',
      scripture: plan.scripture ?? '',
      notes: plan.notes ?? '',
      isPublic: plan.isPublic ?? true,
      groups: plan.groups ?? [],
      sections: plan.sections?.map((section: any) => ({
        id: section.id,
        title: section.title,
        personId: section.personId ?? null,
        personName: section.personName ?? '',
        startTime: section.startTime ?? '',
        durationMinutes: section.durationMinutes ?? undefined,
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
  const watchedIsPublic = form.watch('isPublic');
  const watchedGroups = form.watch('groups');
  const watchedSections = form.watch('sections');
  const hasValidSectionTitles = (watchedSections ?? []).every(
    (section) => section.title.trim().length > 0
  );
  const hasPrivateAudience = watchedIsPublic || (watchedGroups ?? []).length > 0;
  const canSave =
    watchedTitle.trim().length > 0 &&
    watchedDate.trim().length > 0 &&
    watchedTime.trim().length > 0 &&
    hasValidSectionTitles &&
    hasPrivateAudience;

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
    try {
      setSaveError(null);

      await updateServicePlan(churchId, plan.id, {
        title: values.title.trim(),
        dateString: values.dateString,
        timeString: values.timeString,
        theme: values.theme?.trim() ?? '',
        scripture: values.scripture?.trim() ?? '',
        notes: values.notes?.trim() ?? '',
        isPublic: values.isPublic,
        groups: values.isPublic ? [] : values.groups,
        sections: values.sections.map((section) => ({
          id: section.id ?? crypto.randomUUID(),
          title: section.title,
          personId: section.personId ?? null,
          personName: section.personName?.trim() ? section.personName.trim() : null,
          startTime: section.startTime?.trim() ? section.startTime : null,
          durationMinutes: typeof section.durationMinutes === 'number' && Number.isFinite(section.durationMinutes)
            ? section.durationMinutes
            : null,
          notes: section.notes ?? '',
          songIds: Array.isArray(section.songIds) ? section.songIds : [],
          color: section.color,
        })),
      });

      router.push(`/church/${churchId}/service-plan/${plan.id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save service plan');
    }
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
        {saveError && <p className="text-sm text-destructive">{saveError}</p>}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme</FormLabel>
                    <FormControl>
                      <Input placeholder="Kingdom Stewardship, Hope, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scripture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scripture</FormLabel>
                    <FormControl>
                      <Input placeholder="John 3:16, Psalm 23, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            <div className="space-y-4 border-t border-white/20 pt-6 mt-6">
              <h3 className="text-lg font-semibold">Visibility</h3>

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Who should be able to see this service plan?</FormLabel>
                    <FormControl>
                      <div className="flex rounded-md overflow-hidden border border-white/20 bg-black/80">
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange(true);
                            form.setValue('groups', []);
                          }}
                          className={
                            `flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                              field.value
                                ? 'bg-slate-600 text-white'
                                : 'text-white/60 hover:bg-white/10'
                            }`
                          }
                        >
                          Public
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange(false)}
                          className={
                            `flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                              !field.value
                                ? 'bg-slate-600 text-white'
                                : 'text-white/60 hover:bg-white/10'
                            }`
                          }
                        >
                          Private
                        </button>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {!watchedIsPublic && (
                <FormField
                  control={form.control}
                  name="groups"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Visible to Groups</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={EVENT_GROUP_OPTIONS}
                          value={field.value ?? []}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

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
                    personName: '',
                    startTime: '',
                    durationMinutes: undefined,
                    songIds: [],
                    notes: '',
                    color: undefined,
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

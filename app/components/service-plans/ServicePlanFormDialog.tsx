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
import { MultiSelect } from '../ui/multi-select';

import { createServicePlan, updateServicePlan } from '@/app/lib/servicePlans';
import type { ServicePlan, ServicePlanSection } from '@/app/lib/types';
import { useMembers } from '@/app/hooks/useMembers';
import { EVENT_GROUP_OPTIONS } from '@/app/lib/groupOptions';

import dayjs from 'dayjs';
import { SectionEditor } from './SectionEditor';
import { ScriptureLookupPanel } from './ScriptureLookupPanel';
import { useState } from 'react';
import SectionNameDialog from '@/app/components/music/SectionNameSelectionDialog';

// ZOD SCHEMAS — NEW ARCHITECTURE
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

  // NEW: canonical string fields
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  timeString: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time'),

  theme: z.string().optional(),
  scripture: z.string().optional(),
  scriptureText: z.string().optional(),
  scriptureTranslation: z.string().optional(),
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

// SUBMIT HANDLER — NEW ARCHITECTURE
async function handleServicePlanSubmit(
  values: FormValues,
  plan: ServicePlan | null,
  churchId: string,
  onClose: () => void,
  setSaveError: (message: string | null) => void
) {

  const normalizedSections: ServicePlanSection[] = values.sections.map((s) => ({
    id: s.id ?? crypto.randomUUID(),
    title: s.title,
    personId: s.personId ?? null,
    personName: s.personName?.trim() ? s.personName.trim() : null,
    startTime: s.startTime?.trim() ? s.startTime : null,
    durationMinutes: typeof s.durationMinutes === 'number' && Number.isFinite(s.durationMinutes)
      ? s.durationMinutes
      : null,
    notes: s.notes ?? '',
    songIds: Array.isArray(s.songIds) ? s.songIds : [],
    color: s.color,
  }));

  const payload = {
    title: values.title.trim(),
    dateString: values.dateString,
    timeString: values.timeString,
    theme: values.theme?.trim() ?? '',
    scripture: values.scripture?.trim() ?? '',
    scriptureText: values.scriptureText?.trim() ?? '',
    scriptureTranslation: values.scriptureTranslation?.trim() ?? '',
    notes: values.notes?.trim() ?? '',
    sections: normalizedSections,
    isPublic: values.isPublic,
    groups: values.isPublic ? [] : values.groups,
    createdBy: plan?.createdBy,
  };

  try {
    setSaveError(null);

    if (plan) {
      await updateServicePlan(churchId, plan.id, payload);
    } else {
      await createServicePlan(churchId, payload);
    }

    onClose();
  } catch (err) {
    setSaveError(err instanceof Error ? err.message : 'Failed to save service plan');
  }
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
  const [isSectionNameDialogOpen, setIsSectionNameDialogOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { members } = useMembers();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: plan?.title ?? '',

      dateString: plan?.dateString ?? dayjs().format('YYYY-MM-DD'),
      timeString: plan?.timeString ?? '10:00',

      theme: plan?.theme ?? '',
      scripture: plan?.scripture ?? '',
      scriptureText: plan?.scriptureText ?? '',
      scriptureTranslation: plan?.scriptureTranslation ?? 'web',
      notes: plan?.notes ?? '',
      isPublic: plan?.isPublic ?? true,
      groups: plan?.groups ?? [],
      sections:
        plan?.sections?.map((s) => ({
          id: s.id,
          title: s.title,
          personId: s.personId ?? null,
          personName: s.personName ?? '',
          startTime: s.startTime ?? '',
          durationMinutes: s.durationMinutes ?? undefined,
          songIds: s.songIds ?? [],
          notes: s.notes ?? '',
          color: s.color,
        })) ?? [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'sections',
  });

  const watchedTitle = form.watch('title');
  const watchedIsPublic = form.watch('isPublic');
  const watchedGroups = form.watch('groups');
  const watchedSections = form.watch('sections');
  const hasValidSectionTitles = (watchedSections ?? []).every(
    (section) => section.title.trim().length > 0
  );
  const hasPrivateAudience = watchedIsPublic || (watchedGroups ?? []).length > 0;
  const canSubmit =
    watchedTitle.trim().length > 0 &&
    localDateString.trim().length > 0 &&
    localTimeString.trim().length > 0 &&
    hasValidSectionTitles &&
    hasPrivateAudience;

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent
        className="w-[95vw] max-w-3xl max-h-[85dvh] flex flex-col p-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle>{isEdit ? "Edit Service Plan" : "Add Service Plan"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this service plan." : "Create a new service plan."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6 py-2 pr-2">
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
                  onClose,
                  setSaveError
                )
              )}
              className="space-y-6"
            >
              {saveError && <p className="text-sm text-destructive">{saveError}</p>}
              {/* Date & Time */}
              <FormItem>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Date */}
                  <div className="flex flex-col space-y-2">
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
                  <div className="flex flex-col space-y-2">
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
              </div>

              <FormItem>
                <FormLabel>Scripture</FormLabel>
                <ScriptureLookupPanel
                  scripture={form.watch('scripture') ?? ''}
                  scriptureTranslation={form.watch('scriptureTranslation') ?? ''}
                  scriptureText={form.watch('scriptureText') ?? ''}
                  onScriptureChange={(value) => form.setValue('scripture', value, { shouldDirty: true })}
                  onScriptureTranslationChange={(value) => form.setValue('scriptureTranslation', value, { shouldDirty: true })}
                  onScriptureTextChange={(value) => form.setValue('scriptureText', value, { shouldDirty: true })}
                />
              </FormItem>

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

              {/* Sections */}
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
        </div>

        <DialogFooter className="shrink-0 border-t px-6 pb-6 pt-8 flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="service-plan-form" disabled={!canSubmit || form.formState.isSubmitting}>
            {isEdit ? "Save Changes" : "Create Service Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

import { createServicePlan, updateServicePlan } from '../../lib/servicePlans';
import type { ServicePlan, ServicePlanSection } from '../../lib/types';
import { useMembers } from '../../hooks/useMembers';
import { useSongs } from '../../hooks/useSongs';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { SectionEditor } from './SectionEditor';

// ------------------------------------------------------
// THEME
// ------------------------------------------------------
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

// ------------------------------------------------------
// ZOD SCHEMAS
// ------------------------------------------------------
const sectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Section title is required'),
  personId: z.string().nullable(),
  songIds: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.date(),
  notes: z.string().optional(),
  sections: z.array(sectionSchema),
});

type FormValues = z.infer<typeof formSchema>;

// ------------------------------------------------------
// EXTERNAL SUBMIT HANDLER (PURITY-SAFE)
// ------------------------------------------------------
async function handleServicePlanSubmit(
  values: FormValues,
  plan: ServicePlan | null,
  churchId: string,
  onClose: () => void
) {
  const now = Date.now();

  const normalizedSections: ServicePlanSection[] = values.sections.map((s) => ({
    id: s.id ?? crypto.randomUUID(),
    title: s.title,
    personId: s.personId ?? null,
    notes: s.notes ?? '',
    songIds: Array.isArray(s.songIds) ? s.songIds : [],
  }));

  const payload = {
    title: values.title.trim(),
    date: new Date(values.date).toISOString(),
    notes: values.notes?.trim() ?? '',
    sections: normalizedSections,
    createdBy: plan?.createdBy ?? 'system',
    createdAt: plan?.createdAt ?? now,
    updatedAt: now,
  };

  if (plan) {
    await updateServicePlan(churchId, plan.id, payload);
  } else {
    await createServicePlan(churchId, payload);
  }

  onClose();
}

// ------------------------------------------------------
// COMPONENT
// ------------------------------------------------------
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
      date: plan?.date ? new Date(plan.date) : new Date(),
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
            <form
              id="service-plan-form"
              onSubmit={form.handleSubmit((values) =>
                handleServicePlanSubmit(values, plan, churchId, onClose)
              )}
              className="space-y-6"
            >
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
                      <div className="w-full">
                        <ThemeProvider theme={darkTheme}>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <MobileDatePicker
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  sx: {
                                    '& .MuiInputBase-root': {
                                      backgroundColor: 'transparent',
                                      color: 'text.primary',
                                      fontSize: '0.875rem',
                                      borderRadius: '0.5rem',
                                      border: '1px solid hsl(var(--input))',
                                    },
                                    '& .MuiInputBase-root:hover': {
                                      borderColor: 'hsl(var(--input))',
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      border: 'none',
                                    },
                                    '& .MuiInputBase-input': {
                                      padding: '0.5rem 0.75rem',
                                      height: 'auto',
                                    },
                                  },
                                },
                              }}
                              value={dayjs(field.value)}
                              onChange={(next) => {
                                if (!next) return;
                                field.onChange(next.toDate());
                              }}
                            />
                          </LocalizationProvider>
                        </ThemeProvider>
                      </div>
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
                        songIds: [],
                        notes: '',
                      })
                    }
                  >
                    Add Section
                  </Button>
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
            {isEdit ? 'Save Changes' : 'Create Service Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


'use client';

import * as React from 'react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { format } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';

import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useToast } from '@/hooks/use-toast';
import { ContributionChart } from '@/app/contributions/contribution-chart';
import { members, contributions as initialContributions } from '@/lib/data';

// --- MUI X Date Pickers (Mobile-friendly) ---
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';

// --- MUI Theme (local dark mode) ---
import { ThemeProvider, createTheme } from '@mui/material/styles';

// ------------------------------
// Zod schema
// ------------------------------
const contributionSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  category: z.enum(['Tithes', 'Offering', 'Donation', 'Other']),
  contributionType: z.enum(['Digital Transfer', 'Cash', 'Check', 'Other'], {
    required_error: 'Contribution Type is required',
  }),
  date: z.date({ required_error: 'Date is required' }),
});

type ContributionFormValues = z.infer<typeof contributionSchema>;

// ------------------------------
// Page Component
// ------------------------------
export default function ContributionsPage() {
  const { toast } = useToast();
  const [contributions, setContributions] = React.useState(initialContributions);

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      memberId: '',
      amount: 0,
      category: 'Tithes',
      contributionType: 'Digital Transfer',
      date: new Date(),
    },
    mode: 'onSubmit',
  });

  function onSubmit(values: ContributionFormValues) {
    const member = members.find((m) => m.id === values.memberId);
    const memberName = member ? `${member.firstName} ${member.lastName}` : 'Unknown Member';

    const newContribution = {
      id: `c${contributions.length + 1}`,
      memberName,
      ...values,
    };

    setContributions((prev) => [newContribution, ...prev]);

    toast({
      title: 'Contribution Added',
      description: `Added ${values.amount} (${values.contributionType}) for ${memberName}.`,
    });

    form.reset({
      memberId: '',
      amount: 0,
      category: 'Tithes',
      contributionType: 'Digital Transfer',
      date: new Date(),
    });
  }

  // Local dark theme just for this page (you can move this to app-wide Providers)
  const darkTheme = createTheme({
    palette: { mode: 'dark' },
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <PageHeader title="Contributions" />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left column: Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add Contribution</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Member */}
                  <FormField
                    control={form.control}
                    name="memberId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Member</FormLabel>
                        <Select
                          value={field.value ?? ''}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a member" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {members
                              .filter((m) => m.status === 'Active')
                              .map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.firstName} {member.lastName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Amount (controlled to avoid warnings) */}
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full"
                            value={
                              typeof field.value === 'number' && Number.isFinite(field.value)
                                ? String(field.value)
                                : ''
                            }
                            onChange={(e) => {
                              const v = e.target.value;
                              field.onChange(v === '' ? 0 : Number(v));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          value={field.value ?? ''}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Tithes">Tithes</SelectItem>
                            <SelectItem value="Offering">Offering</SelectItem>
                            <SelectItem value="Donation">Donation</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Contribution Type */}
                  <FormField
                    control={form.control}
                    name="contributionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contribution Type</FormLabel>
                        <Select
                          value={field.value ?? ''}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a contribution type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Digital Transfer">Digital Transfer</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Check">Check</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date — MUI MobileDatePicker (dark theme, closes on select) */}
                  <FormField
                    control={form.control}
                    name="date"
                    render={() => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Controller
                              name="date"
                              control={form.control}
                              render={({ field: ctrl }) => (
                                <MobileDatePicker
                                  value={dayjs(ctrl.value)}
                                  onChange={(next: Dayjs | null) => {
                                    if (!next) return;
                                    ctrl.onChange(next.toDate());
                                  }}
                                  closeOnSelect
                                  reduceAnimations
                                  // Compact weekday labels
                                  dayOfWeekFormatter={(d) => d.format('dd').toUpperCase()}
                                  // Make the input and dialog match your dark UI
                                  slotProps={{
                                    textField: {
                                      fullWidth: true,
                                      // Color & background tuned for dark Tailwind/shadcn
                                      sx: {
                                        '& .MuiInputBase-root': {
                                          backgroundColor: 'transparent',
                                          color: 'text.primary',
                                          fontSize: '0.875rem',
                                          borderRadius: '0.5rem', // to match shadcn radius
                                        },
                                        '& .MuiInputLabel-root': {
                                          color: 'text.secondary',
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': {
                                          borderColor: 'rgba(255,255,255,0.2)',
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                          borderColor: 'rgba(255,255,255,0.35)',
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                          borderColor: 'primary.main',
                                        },
                                      },
                                    },
                                    mobilePaper: {
                                      // Dialog/paper background and text for dark
                                      sx: {
                                        bgcolor: 'background.default',
                                        color: 'text.primary',
                                      },
                                    },
                                  }}
                                />
                              )}
                            />
                          </LocalizationProvider>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">
                    Add Contribution
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Contribution Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ContributionChart data={contributions} />
            </CardContent>
          </Card>
        </div>
      </div>
    </ThemeProvider>
  );
}

'use client';

import * as React from 'react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import dayjs, { Dayjs } from 'dayjs';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { addContribution } from '@/lib/contributions';
import type { Member } from '@/lib/types';

// MUI date pickers
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { ThemeProvider, createTheme } from '@mui/material/styles';

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

interface AddContributionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  churchId: string | null;
}

export function AddContributionDialog({
  isOpen,
  onClose,
  members,
  churchId,
}: AddContributionDialogProps) {
  const { toast } = useToast();

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      memberId: '',
      amount: 0,
      category: 'Tithes',
      contributionType: 'Digital Transfer',
      date: new Date(),
    },
  });

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  async function onSubmit(values: ContributionFormValues) {
    if (!churchId) return;

    const member = members.find((m) => m.id === values.memberId);
    const memberName = member
      ? `${member.firstName} ${member.lastName}`
      : 'Unknown Member';

    try {
      await addContribution(churchId, {
        memberId: values.memberId,
        memberName,
        amount: values.amount,
        category: values.category,
        contributionType: values.contributionType,
        date: values.date,
      });

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
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error adding contribution',
        description: (error as Error).message || 'Please try again.',
        variant: 'destructive',
      });
    }
  }

  // Sort members by Last Name, First Name
  const sortedMembers = React.useMemo(() => {
    return [...members].sort((a, b) => {
      const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [members]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent 
        className="max-h-[80vh] overflow-y-auto w-[90vw] sm:w-[500px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add Contribution</DialogTitle>
          <DialogDescription>
            Record a new financial contribution.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Date - Moved to top */}
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
                                    border: '1px solid hsl(var(--input))', // Match shadcn input border
                                  },
                                  '& .MuiInputBase-root:hover': {
                                    borderColor: 'hsl(var(--input))',
                                  },
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    border: 'none', // Remove default MUI outline to use parent border
                                  },
                                  '& .MuiInputBase-input': {
                                    padding: '0.5rem 0.75rem',
                                    height: 'auto',
                                  }
                                },
                              },
                            }}
                            value={dayjs(field.value)}
                            onChange={(next) => {
                              if (!next) return;
                              field.onChange(next.toDate());
                            }}
                            closeOnSelect
                            reduceAnimations
                          />
                        </LocalizationProvider>
                      </ThemeProvider>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Member */}
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sortedMembers
                        .filter((m) => m.status === 'Active')
                        .map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.lastName}, {member.firstName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
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
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
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
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
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

            <DialogFooter className="border-t pt-4">
              <Button type="submit">Add Contribution</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

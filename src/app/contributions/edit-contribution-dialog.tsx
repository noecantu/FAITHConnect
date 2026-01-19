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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useToast } from '@/hooks/use-toast';
import { useChurchId } from '@/hooks/useChurchId';
import { updateContribution, deleteContribution } from '@/lib/contributions';
import type { Contribution, Member } from '@/lib/types';

// MUI date pickers
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { StandardDialogLayout } from '@/components/layout/StandardDialogLayout';

const contributionSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  category: z.enum(['Tithes', 'Offering', 'Donation', 'Other']),
  contributionType: z.enum(['Digital Transfer', 'Cash', 'Check', 'Other']),
  date: z.date(),
});

type ContributionFormValues = z.infer<typeof contributionSchema>;

interface EditContributionDialogProps {
  contribution: Contribution | null;
  members: Member[];
  isOpen: boolean;
  onClose: () => void;
}

export function EditContributionDialog({
  contribution,
  members,
  isOpen,
  onClose,
}: EditContributionDialogProps) {
  const { toast } = useToast();
  const churchId = useChurchId();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);

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

  React.useEffect(() => {
    if (contribution) {
      form.reset({
        memberId: contribution.memberId,
        amount: contribution.amount,
        category: contribution.category,
        contributionType: contribution.contributionType,
        date: new Date(contribution.date),
      });
    }
  }, [contribution, form]);

  async function onSubmit(values: ContributionFormValues) {
    if (!churchId || !contribution) return;

    try {
      await updateContribution(churchId, contribution.id, values);
      toast({
        title: 'Contribution Updated',
        description: 'The contribution details have been saved.',
      });
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error updating contribution',
        description: (error as Error).message || 'Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handleDelete() {
    if (!churchId || !contribution) return;

    try {
      await deleteContribution(churchId, contribution.id);
      toast({
        title: 'Contribution Deleted',
        description: 'The contribution has been successfully deleted.',
      });
      setIsDeleteAlertOpen(false);
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error deleting contribution',
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <StandardDialogLayout
          title="Edit Contribution"
          description="Update the details of this contribution."
          onClose={onClose}
          footer={
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsDeleteAlertOpen(true)}
              >
                Delete
              </Button>
          
              <Button type="submit" form="edit-contribution-form">
                Save Changes
              </Button>
            </div>
          }                              
        >
          <Form {...form}>
            <form
              id="edit-contribution-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* DATE */}
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

              {/* MEMBER */}
              <FormField
                control={form.control}
                name="memberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
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

              {/* AMOUNT */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CATEGORY */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
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

              {/* CONTRIBUTION TYPE */}
              <FormField
                control={form.control}
                name="contributionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contribution Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
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
            </form>
          </Form>
        </StandardDialogLayout>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the contribution record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

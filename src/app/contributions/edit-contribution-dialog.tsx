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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contribution</DialogTitle>
            <DialogDescription>
              Update the details of this contribution.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            />
                          )}
                        />
                      </LocalizationProvider>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setIsDeleteAlertOpen(true)}
                >
                  Delete
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              contribution record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

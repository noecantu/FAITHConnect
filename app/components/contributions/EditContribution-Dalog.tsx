'use client';

import * as React from 'react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import dayjs from 'dayjs';

import { Button } from '@/app/components/ui/button';
import {
  Dialog,
} from '@/app/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';

import { useToast } from '@/app/hooks/use-toast';
import { useChurchId } from '@/app/hooks/useChurchId';
import { updateContribution, deleteContribution } from '@/app/lib/contributions';
import type { Contribution, Member } from '@/app/lib/types';

import Flatpickr from "react-flatpickr";
import { StandardDialogLayout } from '@/app/components/layout/StandardDialogLayout';
import { AlertDialogAction, AlertDialogCancel } from '@radix-ui/react-alert-dialog';

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
  const { churchId } = useChurchId();
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
      await updateContribution(churchId, contribution.id, {
        ...values,
        date: values.date.toISOString(),
      });      
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
        // variant: 'destructive',
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
        // variant: 'destructive',
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
                      <div className="relative">
                        <Flatpickr
                          value={field.value ? dayjs(field.value).toDate() : []}
                          options={{
                            dateFormat: "Y-m-d",
                            altInput: true,
                            altFormat: "F j, Y",
                            allowInput: false,
                            static: true,
                          }}
                          onChange={(selectedDates) => {
                            const d = selectedDates?.[0];
                            if (!d) return;
                            field.onChange(dayjs(d).toDate());
                          }}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
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

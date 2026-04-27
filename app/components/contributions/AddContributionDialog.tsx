'use client';

import * as React from 'react';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, UseFormReturn } from 'react-hook-form';

import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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

import { useToast } from '@/app/hooks/use-toast';
import { addContribution } from '@/app/lib/contributions';
import type { Contribution, Member } from '@/app/lib/types';
import dayjs from 'dayjs';

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  const decimal = rest.join("").slice(0, 2);
  const normalized = rest.length > 0 ? `${whole}.${decimal}` : whole;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizeAmountInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  const decimal = rest.join("").slice(0, 2);
  return rest.length > 0 ? `${whole}.${decimal}` : whole;
}

function toEditableAmount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

function getErrorMessage(error: unknown, fallback = "Please try again."): string {
  if (error instanceof Error && error.message) return error.message;

  if (error && typeof error === "object") {
    const maybe = error as Record<string, unknown>;
    const parts = [maybe.message, maybe.code, maybe.details]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0);
    if (parts.length > 0) return parts.join(" | ");
  }

  return fallback;
}

const contributionSchema = z.object({
  memberId: z.string().optional(),
  customContributorName: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be positive'),
  category: z.enum(['Tithes', 'Offering', 'Donation', 'Other']),
  contributionType: z.enum(['Digital Transfer', 'Cash', 'Check', 'Other']),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
}).refine(
  (data) => data.memberId || data.customContributorName,
  {
    message: "Select a member or enter a contributor name",
    path: ["memberId"],
  }
);

type ContributionFormValues = z.infer<typeof contributionSchema>;

interface AddContributionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  churchId: string | null;
  onSaved?: () => void;
}

export function AddContributionDialog({
  isOpen,
  onClose,
  members,
  churchId,
  onSaved,
}: AddContributionDialogProps) {
  const { toast } = useToast();
  const [amountInput, setAmountInput] = React.useState(usdFormatter.format(0));
  const [isAmountFocused, setIsAmountFocused] = React.useState(false);

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      memberId: '',
      customContributorName: "",
      amount: 0,
      category: 'Tithes',
      contributionType: 'Digital Transfer',
      date: dayjs().format("YYYY-MM-DD"),
      notes: "",
    },
  });

  React.useEffect(() => {
    if (!isOpen) return;
    const currentAmount = form.getValues("amount") ?? 0;
    setAmountInput(
      isAmountFocused
        ? toEditableAmount(Number(currentAmount) || 0)
        : usdFormatter.format(Number(currentAmount) || 0)
    );
  }, [isOpen, form, isAmountFocused]);

  async function onSubmit(values: ContributionFormValues) {
    if (!churchId) return;

    let memberId: string | undefined = undefined;
    let memberName: string;

    // Determine member or custom contributor
    if (values.memberId && values.memberId !== "custom") {
      const member = members.find((m) => m.id === values.memberId);
      memberId = values.memberId;
      memberName = member
        ? `${member.firstName} ${member.lastName}`
        : "Unknown Member";
    } else {
      memberName = values.customContributorName || "Unknown Contributor";
    }

    // Build Firestore-safe payload (no undefined fields)
    const payload: Omit<Contribution, "id"> = {
      memberName,
      amount: values.amount,
      category: values.category,
      contributionType: values.contributionType,
      date: values.date,
    };

    if (memberId) {
      payload.memberId = memberId;
    }

    if (values.notes) {
      payload.notes = values.notes;
    }

    try {
      await addContribution(churchId, payload);

      toast({
        title: "Contribution Added",
        description: `Added ${values.amount} (${values.contributionType}) for ${memberName}.`,
      });

      form.reset({
        memberId: "",
        customContributorName: "",
        amount: 0,
        category: "Tithes",
        contributionType: "Digital Transfer",
        date: dayjs().format("YYYY-MM-DD"),
      });
      setIsAmountFocused(false);
      setAmountInput(usdFormatter.format(0));

      onSaved?.();
      onClose();
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("Add contribution error:", message);
      toast({
        title: "Error adding contribution",
        description: message,
        // variant: "destructive",
      });
    }
  }

  const sortedMembers = React.useMemo(() => {
    return [...members].sort((a, b) => {
      const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [members]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[95vw] max-w-lg max-h-[85dvh] flex flex-col p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header (non-scrollable) */}
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle>Add Contribution</DialogTitle>
          <DialogDescription>
            Record a new financial contribution.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-grow overflow-y-auto px-6 py-4">
          <Form {...form}>
            <form
              id="add-contribution-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={dayjs(field.value).format("YYYY-MM-DD")}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                        className="w-full"
                      />
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
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value !== "custom") {
                          form.setValue("customContributorName", "");
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sortedMembers
                          .filter((m) => m.status === "Active")
                          .map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.lastName}, {member.firstName}
                            </SelectItem>
                          ))}

                        <SelectItem value="custom">Not a member</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CustomContributorField form={form} />

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="$0.00"
                        value={amountInput}
                        className="text-right tabular-nums"
                        onFocus={() => {
                          setIsAmountFocused(true);
                          const current = Number(field.value) || 0;
                          setAmountInput(toEditableAmount(current));
                        }}
                        onChange={(e) => {
                          const sanitized = sanitizeAmountInput(e.target.value);

                          if (sanitized.trim() === "") {
                            setAmountInput("");
                            field.onChange(0);
                            return;
                          }

                          const parsed = parseCurrencyInput(sanitized);
                          field.onChange(parsed);
                          setAmountInput(sanitized);
                        }}
                        onBlur={() => {
                          setIsAmountFocused(false);
                          const parsed = parseCurrencyInput(amountInput);
                          field.onChange(parsed);
                          setAmountInput(usdFormatter.format(parsed));
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

              {/* Contribution Type */}
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

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        className="
                          w-full
                          rounded-md
                          border border-white/20
                          bg-black/80
                          text-white text-sm
                          px-3 py-2
                          focus:outline-none
                          focus:ring-2
                          focus:ring-white/30
                          resize-none
                          h-24
                        "
                        placeholder="Optional Notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </form>
          </Form>
        </div>

        {/* Footer (non-scrollable) */}
        <DialogFooter className="shrink-0 border-t px-6 pb-6 pt-4 flex justify-end gap-2">
          <Button type="submit" form="add-contribution-form">
            Add Contribution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomContributorField({ form }: { form: UseFormReturn<ContributionFormValues> }) {
  if (form.watch("memberId") !== "custom") return null;

  return (
    <FormField
      control={form.control}
      name="customContributorName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Contributor Name</FormLabel>
          <FormControl>
            <Input placeholder="Enter contributor name" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

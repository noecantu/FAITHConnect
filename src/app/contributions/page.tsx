'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ContributionChart } from '@/app/contributions/contribution-chart';
import { members, contributions as initialContributions } from '@/lib/data';

const contributionSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  category: z.enum(['Tithes', 'Offering', 'Donation', 'Other']),
  date: z.date({ required_error: 'Date is required' }),
});

export default function ContributionsPage() {
  const { toast } = useToast();
  const [contributions, setContributions] = React.useState(initialContributions);

  const form = useForm<z.infer<typeof contributionSchema>>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      category: 'Tithes',
      date: new Date(),
    },
  });

  function onSubmit(values: z.infer<typeof contributionSchema>) {
    const memberName =
      members.find((m) => m.id === values.memberId)?.firstName +
      ' ' +
      members.find((m) => m.id === values.memberId)?.lastName;

    const newContribution = {
      id: `c${contributions.length + 1}`,
      memberName,
      ...values,
    };
    setContributions((prev) => [newContribution, ...prev]);

    toast({
      title: 'Contribution Added',
      description: `Added ${values.amount} for ${memberName}.`,
    });
    form.reset({
      category: 'Tithes',
      date: new Date(),
    });
  }

  return (
    <>
      <PageHeader title="Contributions" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add Contribution</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="memberId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Member</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
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
                          <Input type="number" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
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
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
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
    </>
  );
}

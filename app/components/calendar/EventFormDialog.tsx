import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { StandardDialogLayout } from "../layout/StandardDialogLayout";

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

import { format } from "date-fns";
import { UseFormReturn } from "react-hook-form";
import Flatpickr from "react-flatpickr";
import type { Event } from "@/app/lib/types";

interface EventFormValues {
  date: Date;
  title: string;
  description?: string;
}

export function EventFormDialog({
  open,
  isEditing,
  selectedDate,
  form,
  onSubmit,
  onOpenChange,
}: {
  open: boolean;
  isEditing: boolean;
  event: Event | null;
  selectedDate: Date;
  form: UseFormReturn<EventFormValues>;
  onSubmit: (data: EventFormValues) => void;
  onOpenChange: (open: boolean) => void;
}) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <StandardDialogLayout
        title={isEditing ? "Edit Event" : "Add New Event"}
        description={
          isEditing
            ? "Update the details of this event."
            : `Add a new event for ${format(selectedDate, "PPP")}.`
        }
        onClose={() => onOpenChange(false)}
        footer={
          <>
            <Button type="submit" form="event-form">
              {isEditing ? "Save Changes" : "Add Event"}
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form id="event-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* DATE */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Flatpickr
                      value={field.value}
                      options={{
                        dateFormat: "m-d-Y",
                        defaultDate: field.value,
                        allowInput: false,
                        altInput: true,
                        altFormat: "m-d-Y",
                        monthSelectorType: "dropdown",
                      }}
                      onChange={([selected]) => {
                        if (!selected) return;
                        field.onChange(selected);
                      }}
                      className="block w-full bg-black/40 text-white border-white/20 rounded-md px-3 py-2 text-center"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* TITLE */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sunday Service" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DESCRIPTION */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Event details..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </form>
        </Form>
      </StandardDialogLayout>
    </Dialog>
  );
}

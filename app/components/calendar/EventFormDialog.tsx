'use client';

import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { StandardDialogLayout } from "../layout/StandardDialogLayout";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";

import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { MultiSelect } from "../ui/multi-select";

import Flatpickr from "react-flatpickr";
import { format } from "date-fns";

import type { Event } from "@/app/lib/types";
import type { UseFormReturn } from "react-hook-form";

import * as z from "zod";

// ------------------------------
// SCHEMA
// ------------------------------
export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.date(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  groups: z.array(z.string()).optional(),
});

export type EventFormValues = z.infer<typeof eventSchema>;

// ------------------------------
// PROPS
// ------------------------------
interface EventFormDialogProps {
  open: boolean;
  isAdmin: boolean;
  managerGroup: string | null;
  isEditing: boolean;
  event: Event | null;
  selectedDate: Date;
  form: UseFormReturn<EventFormValues>;
  onSubmit: (data: EventFormValues) => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
  onDelete?: (id: string) => void;
}

// ------------------------------
// COMPONENT
// ------------------------------
export function EventFormDialog({
  open,
  isAdmin,
  managerGroup,
  isEditing,
  event,
  selectedDate,
  form,
  onSubmit,
  onOpenChange,
  onDelete,
}: EventFormDialogProps) {
  const isManager = !isAdmin && !!managerGroup;
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
          <div className="flex justify-end w-full gap-2">
            {isEditing && onDelete && event && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete(event.id)}
              >
                Delete
              </Button>
            )}

            <Button type="submit" form="event-form">
              {isEditing ? "Save Changes" : "Add Event"}
            </Button>
          </div>
        }
      >
        <Form {...form}>
          <form
            id="event-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
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
                        defaultDate: field.value,
                        allowInput: false,
                        altInput: true,
                        altFormat: "m-d-Y",
                        dateFormat: "m-d-Y",
                        monthSelectorType: "dropdown",
                      }}
                      onChange={([selected]) => {
                        if (selected) field.onChange(selected);
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
                    <Textarea
                      placeholder="Event details..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* -------------------------------------- */}
            {/* VISIBILITY CONTROLS */}
            {/* -------------------------------------- */}

            {isAdmin && (
              <div className="space-y-4 border-t border-white/10 pt-4 mt-4">

                {/* PUBLIC TOGGLE */}
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Public Event</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* GROUP SELECTOR */}
                <FormField
                  control={form.control}
                  name="groups"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Visible to Groups</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={[
                            { label: "Caretaker", value: "caretaker" },
                            { label: "Event Team", value: "events" },
                            { label: "Men's Group", value: "men" },
                            { label: "Music Ministry", value: "music" },
                            { label: "Ushers", value: "usher" },
                            { label: "Women's Group", value: "women" },
                            { label: "Youth Group", value: "youth" },
                          ]}
                          value={field.value ?? []}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {isManager && (
              <div className="space-y-4 border-t border-white/10 pt-4 mt-4">
                <FormItem>
                  <FormLabel>Group</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    {managerGroup}
                  </div>
                </FormItem>
              </div>
            )}
          </form>
        </Form>
      </StandardDialogLayout>
    </Dialog>
  );
}

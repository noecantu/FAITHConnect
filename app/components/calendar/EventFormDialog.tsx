'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { MultiSelect } from "../ui/multi-select";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";

import Flatpickr from "react-flatpickr";
import { format } from "date-fns";

import type { Event } from "@/app/lib/types";
import type { UseFormReturn } from "react-hook-form";
import * as z from "zod";

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.date(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  groups: z.array(z.string()).optional(),
});

export type EventFormValues = z.infer<typeof eventSchema>;

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="max-w-lg bg-black/60 backdrop-blur-xl border border-white/10 text-white space-y-4"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Edit Event" : "Add New Event"}
          </DialogTitle>

          <DialogDescription className="text-white/60">
            {isEditing
              ? "Update the details of this event."
              : `Add a new event for ${format(selectedDate, "PPP")}.`}
          </DialogDescription>
        </DialogHeader>

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
                    <div className="relative">
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
                        className="w-full px-3 py-2 text-sm rounded-md bg-transparent"
                      />

                      {/* This wrapper gives the Input-style border + outline */}
                      <div className="
                        pointer-events-none
                        absolute inset-0
                        rounded-md
                        border border-white/20
                        outline outline-1 outline-white/20
                      " />
                    </div>
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
                <FormItem className="space-y-2">
                  <FormLabel>Event Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Sunday Service"
                      className="bg-black/40 border-white/20"
                      {...field}
                    />
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
                <FormItem className="space-y-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Event details..."
                      className="bg-black/40 border-white/20 resize-none"
                      rows={4}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ADMIN CONTROLS */}
            {isAdmin && (
              <div className="space-y-4 border-t border-white/10 pt-4 mt-4">

                {/* PUBLIC */}
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

                {/* GROUPS */}
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

            {/* MANAGER VIEW */}
            {isManager && (
              <div className="space-y-2 border-t border-white/10 pt-4 mt-4">
                <FormLabel>Group</FormLabel>
                <div className="text-sm text-white/70">{managerGroup}</div>
              </div>
            )}
          </form>
        </Form>

        <DialogFooter className="flex justify-between pt-4">
          {isEditing && onDelete && event && (
            <Button
              variant="destructive"
              onClick={() => onDelete(event.id)}
              className="w-24"
            >
              Delete
            </Button>
          )}

          <Button type="submit" form="event-form" className="w-32">
            {isEditing ? "Save Changes" : "Add Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

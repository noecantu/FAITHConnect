import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { StandardDialogLayout } from "../layout/StandardDialogLayout";

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ThemeProvider } from "@mui/material/styles";
import dayjs from "dayjs";

import type { Event } from "../../lib/types";
import { format } from "date-fns";

export function EventFormDialog({
  open,
  isEditing,
  event,
  selectedDate,
  form,
  onSubmit,
  onOpenChange,
  muiTheme,
}: {
  open: boolean;
  isEditing: boolean;
  event: Event | null;
  selectedDate: Date;
  form: any;
  onSubmit: (data: any) => void;
  onOpenChange: (open: boolean) => void;
  muiTheme: any;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                    <ThemeProvider theme={muiTheme}>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <MobileDatePicker
                          slotProps={{
                            textField: { fullWidth: true },
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

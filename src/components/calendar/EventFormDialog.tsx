import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
  import { Input } from "@/components/ui/input";
  import { Textarea } from "@/components/ui/textarea";
  
  import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
  import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
  import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
  import { ThemeProvider } from "@mui/material/styles";
  import dayjs from "dayjs";
  
  import type { Event } from "@/lib/types";
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
      <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
        <DialogContent className="flex flex-col bg-background p-0">
          <DialogHeader className="shrink-0 px-4 py-4 sm:px-6">
            <DialogTitle>{isEditing ? "Edit Event" : "Add New Event"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the details of this event."
                : `Add a new event for ${format(selectedDate, "PPP")}.`}
            </DialogDescription>
          </DialogHeader>
  
          <div className="grow overflow-y-auto px-4 sm:px-6 pb-[calc(var(--footer-h,3.5rem)+env(safe-area-inset-bottom)+0.75rem)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">

              {/* DATE FIRST */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Date</FormLabel>

                    <FormControl>
                      <div className="w-full">
                        <ThemeProvider theme={muiTheme}>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <MobileDatePicker
                              slotProps={{
                                textField: {
                                  fullWidth: true,
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
                      <Textarea placeholder="Event details..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </form>
          </Form>
        </div>  
          <DialogFooter
            className="shrink-0 px-4 py-3 sm:px-6"
            style={{ ["--footer-h" as any]: "3.5rem" }}
          >
            <Button type="submit" onClick={form.handleSubmit(onSubmit)} className="w-full sm:w-auto">
              {isEditing ? "Save Changes" : "Add Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
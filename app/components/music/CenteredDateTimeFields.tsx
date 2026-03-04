'use client';

import { useState } from "react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";

import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

interface CenteredDateTimeFieldsProps {
  dateString: string;
  timeString: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}

export function CenteredDateTimeFields({
  dateString,
  timeString,
  onDateChange,
  onTimeChange,
}: CenteredDateTimeFieldsProps) {
  const [open, setOpen] = useState(false);
  const date = dateString ? new Date(dateString) : undefined;

  return (
    <div className="space-y-4">
      {/* Date */}
      <div className="space-y-1">
        <Label>Date</Label>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Input
              readOnly
              value={date ? format(date, "MMMM d, yyyy") : ""}
              className="cursor-pointer"
            />
          </DialogTrigger>

          <DialogContent className="max-w-sm p-0">
            <DialogHeader className="p-4 pb-2">
              <DialogTitle>Select Date</DialogTitle>
            </DialogHeader>

            <div className="p-4 pt-0">
              <DayPicker
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (!d) return;
                  onDateChange(format(d, "yyyy-MM-dd"));
                  setOpen(false);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Time */}
      <div className="space-y-1">
        <Label>Time</Label>
        <Input
          type="time"
          value={timeString}
          onChange={(e) => onTimeChange(e.target.value)}
        />
      </div>
    </div>
  );
}

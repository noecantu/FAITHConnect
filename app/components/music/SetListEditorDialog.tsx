'use client';

import { useState } from 'react';
import { Dialog, DialogTrigger } from '../ui/dialog';
import { StandardDialogLayout } from '../layout/StandardDialogLayout';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { createSetList, updateSetList } from '@/app/lib/setlists';
import { useChurchId } from '@/app/hooks/useChurchId';
import { SetList } from '@/app/lib/types';
// import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
// import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import Flatpickr from "react-flatpickr";

export function SetListEditorDialog({
  children,
  mode,
  setList,
}: {
  children: React.ReactNode;
  mode: 'create' | 'edit';
  setList?: SetList;
}) {
  const { churchId } = useChurchId();
  const [open, setOpen] = useState(false);

  // Title
  const [title, setTitle] = useState(setList?.title ?? '');

  // Canonical date/time strings
  const [dateString, setDateString] = useState(
    setList?.dateString ?? new Date().toISOString().substring(0, 10)
  );

  const [timeString, setTimeString] = useState(
    setList?.timeString ?? "09:00"
  );

  // Calendar popover
  // const [openCalendar, setOpenCalendar] = useState(false);

  // Convert dateString → Date for the calendar UI only
  const parsedDate = new Date(`${dateString}T00:00:00`);

  const handleSave = async () => {
    if (!churchId) return;

    if (mode === 'create') {
      await createSetList(churchId, {
        title,
        dateString,
        timeString,
        createdBy: 'system',
        sections: [],
        serviceType: null,
      });
    } else {
      await updateSetList(churchId, setList!.id, {
        title,
        dateString,
        timeString,
      });
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <StandardDialogLayout
        title={mode === 'create' ? 'Create Set List' : 'Edit Set List'}
        description="Manage set list details."
        onClose={() => setOpen(false)}
        footer={
          <Button onClick={handleSave}>
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        }
      >
        <div className="space-y-4">

          {/* Title */}
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="w-full">
            <Label>Date</Label>

            <Flatpickr
              value={parsedDate ? parsedDate : []}
              options={{
                dateFormat: "Y-m-d",
                altInput: true,
                altFormat: "F j, Y",
                static: true,
                monthSelectorType: "static",
              }}
              onChange={(selectedDates) => {
                if (!selectedDates?.[0]) return;
                setDateString(format(selectedDates[0], "yyyy-MM-dd"));
              }}
              className="flatpickr-input w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Time */}
          <div>
            <Label>Time</Label>
            <Input
              type="time"
              value={timeString}
              onChange={(e) => setTimeString(e.target.value)}
            />
          </div>

        </div>
      </StandardDialogLayout>
    </Dialog>
  );
}

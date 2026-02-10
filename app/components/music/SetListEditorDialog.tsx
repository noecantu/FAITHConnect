'use client';

import { useState } from 'react';
import { Dialog, DialogTrigger } from '../ui/dialog';
import { StandardDialogLayout } from '../layout/StandardDialogLayout';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { createSetList, updateSetList } from '../../lib/setlists';
import { useChurchId } from '../../hooks/useChurchId';
import { SetList } from '../../lib/types';
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";

export function SetListEditorDialog({
  children,
  mode,
  setList,
}: {
  children: React.ReactNode;
  mode: 'create' | 'edit';
  setList?: SetList;
}) {
  const churchId = useChurchId();
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
  const [openCalendar, setOpenCalendar] = useState(false);

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

          {/* Date */}
          <div>
            <Label>Date</Label>

            <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {parsedDate ? format(parsedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={parsedDate}
                  onSelect={(d) => {
                    if (!d) return;
                    setDateString(format(d, "yyyy-MM-dd"));
                    setOpenCalendar(false);
                  }}
                />
              </PopoverContent>
            </Popover>
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

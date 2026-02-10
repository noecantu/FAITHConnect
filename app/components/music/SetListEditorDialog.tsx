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

  const [title, setTitle] = useState(setList?.title ?? '');
  const [date, setDate] = useState(
    setList?.date.toISOString().substring(0, 10) ??
      new Date().toISOString().substring(0, 10)
  );
  const [openCalendar, setOpenCalendar] = useState(false);
  const parsedDate = new Date(date);
  
  const handleSave = async () => {
    if (!churchId) return;

    if (mode === 'create') {
      await createSetList(churchId, {
        title,
        date: new Date(date),
        createdBy: 'system',
        sections: [],
        time: '',
        serviceType: null
      });
    } else {
      await updateSetList(churchId, setList!.id, {
        title,
        date: new Date(date),
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
        footer={<Button onClick={handleSave}>{mode === 'create' ? 'Create' : 'Save'}</Button>}
      >
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

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
                    setDate(format(d, "yyyy-MM-dd"));
                    setOpenCalendar(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

        </div>
      </StandardDialogLayout>
    </Dialog>
  );
}

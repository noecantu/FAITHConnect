'use client';

import { useState } from 'react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { StandardDialogLayout } from '@/components/layout/StandardDialogLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { createSetList, updateSetList } from '@/lib/setlists';
import { useChurchId } from '@/hooks/useChurchId';
import { SetList } from '@/lib/types';

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

  const handleSave = async () => {
    if (!churchId) return;

    if (mode === 'create') {
      await createSetList(churchId, {
        title,
        date: new Date(date),
        songs: [],
        createdBy: 'system',
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
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </StandardDialogLayout>
    </Dialog>
  );
}

'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SetList } from '@/lib/types';
import { SetListEditorDialog } from './SetListEditorDialog';
import { SetListDeleteDialog } from './SetListDeleteDialog';
import Link from 'next/link';

export function SetListList({
  lists,
  loading,
  canManage,
}: {
  lists: SetList[];
  loading: boolean;
  canManage: boolean;
}) {
  if (loading) {
    return <p className="text-muted-foreground">Loading set lists…</p>;
  }

  if (lists.length === 0) {
    return <p className="text-muted-foreground">No set lists found.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {lists.map((list) => (
        <Card key={list.id} className="p-4 flex justify-between items-center">
          <div>
            <p className="font-semibold">{list.title}</p>
            <p className="text-sm text-muted-foreground">
              {list.date.toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-2">
            <Link href={`/music/setlists/${list.id}`}>
              <Button variant="outline" size="sm">Open</Button>
            </Link>

            {canManage && (
              <>
                <SetListEditorDialog mode="edit" setList={list}>
                  <Button variant="outline" size="sm">Edit</Button>
                </SetListEditorDialog>

                <SetListDeleteDialog setList={list} />
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
